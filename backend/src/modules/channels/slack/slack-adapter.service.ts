import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { App } from '@slack/bolt';
import { FlowOrchestratorService, OutboundReply } from '../../flow/flow-orchestrator.service';
import { toSlackMessage } from './block-kit-renderer';
import { mapSlackAction, mapSlackMessage } from './slack-inbound';

@Injectable()
export class SlackAdapterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SlackAdapterService.name);
  private app?: App;

  constructor(private readonly orchestrator: FlowOrchestratorService) {}

  async onModuleInit(): Promise<void> {
    const token = process.env.SLACK_BOT_TOKEN;
    const appToken = process.env.SLACK_APP_TOKEN;
    if (!token || !appToken) {
      this.logger.warn('SLACK_BOT_TOKEN / SLACK_APP_TOKEN not set — Slack adapter disabled');
      return;
    }

    const app = new App({ token, appToken, socketMode: true });

    const handle = async (
      inbound: ReturnType<typeof mapSlackMessage>,
      channel: string,
      threadTs: string,
    ) => {
      if (!inbound) return;
      let reply: OutboundReply;
      try {
        reply = await this.orchestrator.handle(inbound);
      } catch (err) {
        this.logger.error(`orchestrator failed for ${inbound.threadKey}`, err as Error);
        reply = { kind: 'text', text: 'Something went wrong. Please try again. / 出错了，请重试。' };
      }
      try {
        await app.client.chat.postMessage({ channel, thread_ts: threadTs, ...toSlackMessage(reply) });
      } catch (err) {
        // Failed to post reply message. Degrade gracefully and log the error instead of throwing.
        this.logger.error(`failed to post Slack message for ${inbound.threadKey}`, err as Error);
      }
    };

    // DM messages and channel mentions are the two entry points.
    app.message(async ({ message }) => {
      const ev = message as { channel: string; ts: string; thread_ts?: string; text?: string; bot_id?: string; subtype?: string; channel_type?: string };
      if (ev.channel_type !== 'im') return; // channels go through app_mention
      await handle(mapSlackMessage(ev), ev.channel, ev.thread_ts ?? ev.ts);
    });

    app.event('app_mention', async ({ event }) => {
      const ev = event as { channel: string; ts: string; thread_ts?: string; text?: string };
      await handle(mapSlackMessage(ev), ev.channel, ev.thread_ts ?? ev.ts);
    });

    app.action(/card_(button_\d+|input)/, async ({ ack, body, action }) => {
      await ack();
      const b = body as { channel?: { id: string }; container?: { channel_id: string; thread_ts?: string; message_ts: string } };
      const channel = b.channel?.id ?? b.container?.channel_id ?? '';
      const threadTs = b.container?.thread_ts ?? b.container?.message_ts ?? '';
      const a = action as { action_id: string; value?: string; block_id?: string };
      const inbound = mapSlackAction({ channel, threadTs, actionId: a.action_id, value: a.value, blockId: a.block_id });
      await handle(inbound, channel, threadTs);
    });

    await app.start();
    this.app = app;
    this.logger.log('Slack adapter connected (Socket Mode)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.app?.stop();
  }
}
