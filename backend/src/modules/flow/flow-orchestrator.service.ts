import { Injectable } from '@nestjs/common';
import { FlowConfig } from '../../interfaces/flow';
import { ChannelKind, Session, ThreadRef } from '../../interfaces/session';
import { SessionService } from '../session/session.service';
import { InvestigationQueueService } from '../queue/investigation.queue';
import { FlowRegistryService } from './flow-registry.service';
import { StepEngineService } from './step-engine.service';
import { CardSpec } from './card.types';

export interface InboundMessage {
  threadKey: string;
  channel: ChannelKind;
  threadRef: ThreadRef;
  text?: string;
  action?: Record<string, unknown>;
}

export type OutboundReply = { kind: 'card'; card: CardSpec } | { kind: 'text'; text: string };

@Injectable()
export class FlowOrchestratorService {
  constructor(
    private readonly registry: FlowRegistryService,
    private readonly steps: StepEngineService,
    private readonly sessions: SessionService,
    private readonly queue: InvestigationQueueService,
  ) {}

  async handle(input: InboundMessage): Promise<OutboundReply> {
    const existing = await this.sessions.get(input.threadKey);

    // 0. Explicit close action → terminate session (no-op if it does not exist).
    if (input.action && input.action.type === 'close') {
      await this.sessions.close(input.threadKey);
      return { kind: 'text', text: existing?.locale === 'en' ? 'Session closed.' : '会话已关闭。' };
    }

    // 1. New thread + keyword → create session, render first step.
    if (!existing || existing.state === 'CLOSED') {
      const matched = input.text ? this.registry.match(input.text) : undefined;
      if (!matched) return { kind: 'text', text: 'Unknown command. Try: diagnose / 诊断' };
      const session = await this.sessions.upsert(input.threadKey, matched.config.command, matched.locale, input.channel, input.threadRef);
      return this.renderStep(matched.config, session);
    }

    // Stale/removed command on an existing session → friendly text, not a crash.
    const config = this.registry.get(existing.command);
    if (!config) return { kind: 'text', text: 'Unknown command. Try: diagnose / 诊断' };

    // 2. Card action → record value, advance.
    if (input.action && typeof input.action.value === 'string') {
      const stepId = String(input.action.stepId);
      existing.collected[stepId] = input.action.value;
      existing.stepIndex += 1;
      await this.sessions.save(existing);
      if (existing.stepIndex < config.steps.length) return this.renderStep(config, existing);
      // Wizard finished — enter conversation (conversational policy).
      return { kind: 'text', text: existing.locale === 'en' ? 'Ready. Describe the issue.' : '准备就绪，请描述问题。' };
    }

    // 3. Free text after wizard → enqueue investigation, acknowledge asynchronously.
    if (input.text && existing.stepIndex >= config.steps.length) {
      if (existing.state === 'INVESTIGATING') {
        return { kind: 'text', text: existing.locale === 'en' ? 'Investigation in progress — please wait for the report in this thread.' : '调查进行中——请等待本主题内的报告。' };
      }
      await this.queue.enqueue({
        threadKey: existing.threadKey,
        channel: existing.channel,
        threadRef: existing.threadRef,
        locale: existing.locale,
        skill: config.worker.skill,
        collected: existing.collected,
        issue: input.text,
      });
      await this.sessions.setState(existing.threadKey, 'INVESTIGATING');
      return { kind: 'text', text: existing.locale === 'en' ? 'Investigating… I will reply in this thread.' : '调查中…结果会回复在本主题内。' };
    }

    // 4. Mid-wizard free text → re-render current step.
    return this.renderStep(config, existing);
  }

  private async renderStep(config: FlowConfig, session: Session): Promise<OutboundReply> {
    let idx = session.stepIndex;
    while (idx < config.steps.length && !this.steps.shouldRender(config.steps[idx], session.collected)) {
      idx += 1;
    }
    session.stepIndex = idx;
    await this.sessions.save(session);
    if (idx >= config.steps.length) {
      return { kind: 'text', text: session.locale === 'en' ? 'Ready. Describe the issue.' : '准备就绪，请描述问题。' };
    }
    const card = this.steps.renderStepCard(config.steps[idx], {
      locale: session.locale,
      threadKey: session.threadKey,
      namespace: 'wizard',
      collected: session.collected,
    });
    return { kind: 'card', card };
  }
}
