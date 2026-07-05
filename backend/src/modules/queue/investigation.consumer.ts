import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { INVESTIGATION_QUEUE, InvestigationJob } from '../../interfaces/queue';
import { SessionService } from '../session/session.service';
import { ChannelPushRegistry } from '../channels/channel-push.registry';
import { ClaudeRunnerService } from '../worker/claude-runner.service';
import { buildInvestigationPrompt, isWorkerSuccess, parseResult, parseResultJson, parseSessionId } from '../worker/run-investigation';
import { buildRepairPrompt, CARD_GRAMMAR_PROMPT, toReportReply, validateWorkerCard } from '../worker/card-validator';
import { OutboundReply } from '../flow/flow-orchestrator.service';

const MAX_REPAIR = 2;

@Processor(INVESTIGATION_QUEUE)
export class InvestigationConsumer extends WorkerHost {
  private readonly logger = new Logger(InvestigationConsumer.name);

  constructor(
    private readonly sessions: SessionService,
    private readonly pushRegistry: ChannelPushRegistry,
    private readonly runner: ClaudeRunnerService,
  ) { super(); }

  async process(job: Job<InvestigationJob>): Promise<void> {
    const d = job.data;
    let out = await this.runner.run(buildInvestigationPrompt({ ...d, grammar: CARD_GRAMMAR_PROMPT }), null);

    if (!out.ok || !isWorkerSuccess(out.stdout)) {
      await this.deliver(d, { kind: 'text', text: d.locale === 'en' ? 'Investigation failed — please describe the issue again to retry.' : '调查失败——请重新描述问题以重试。' });
      await this.sessions.setState(d.threadKey, 'ACTIVE');
      return;
    }

    const sessionId = parseSessionId(out.stdout);
    let result = parseResult(out.stdout);
    let verdict = validateWorkerCard(parseResultJson(result));

    for (let round = 0; !verdict.ok && round < MAX_REPAIR; round += 1) {
      out = await this.runner.run(buildRepairPrompt(verdict.errors), sessionId);
      result = parseResult(out.stdout) ?? result;
      verdict = validateWorkerCard(parseResultJson(parseResult(out.stdout)));
    }

    const reply: OutboundReply = verdict.ok
      ? toReportReply(verdict.card, d.locale)
      : { kind: 'text', text: result ?? '(empty result)' }; // degrade: never drop content
    await this.deliver(d, reply);
    await this.sessions.setState(d.threadKey, 'AWAITING_FEEDBACK');
  }

  private async deliver(d: InvestigationJob, reply: OutboundReply): Promise<void> {
    try { await this.pushRegistry.push(d.channel, d.threadRef, reply); }
    catch (err) { this.logger.error(`push-back failed for ${d.threadKey}`, err as Error); }
  }
}
