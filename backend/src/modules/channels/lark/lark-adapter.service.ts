import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Lark from '@larksuiteoapi/node-sdk';
import { ChannelPushRegistry } from '../channel-push.registry';
import { FlowOrchestratorService, OutboundReply } from '../../flow/flow-orchestrator.service';
import { toLarkMessage } from './lark-card-renderer';
import { LarkInbound, mapLarkCardAction, mapLarkMessage } from './lark-inbound';

@Injectable()
export class LarkAdapterService implements OnModuleInit {
  private readonly logger = new Logger(LarkAdapterService.name);

  constructor(
    private readonly orchestrator: FlowOrchestratorService,
    private readonly pushRegistry: ChannelPushRegistry,
  ) {}

  onModuleInit(): void {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    if (!appId || !appSecret) {
      this.logger.warn('LARK_APP_ID / LARK_APP_SECRET not set — Lark adapter disabled');
      return;
    }

    const client = new Lark.Client({ appId, appSecret });
    const wsClient = new Lark.WSClient({ appId, appSecret });

    const handle = async (inbound: LarkInbound | null) => {
      if (!inbound) return;
      let reply: OutboundReply;
      try {
        reply = await this.orchestrator.handle(inbound);
      } catch (err) {
        this.logger.error(`orchestrator failed for ${inbound.threadKey}`, err as Error);
        reply = { kind: 'text', text: 'Something went wrong. Please try again. / 出错了，请重试。' };
      }
      const { msgType, content } = toLarkMessage(reply);
      try {
        await client.im.v1.message.reply({
          path: { message_id: inbound.replyTo },
          data: { msg_type: msgType, content },
        });
      } catch (err) {
        // Failed to send reply. Degrade gracefully and log the error instead of throwing.
        this.logger.error(`failed to send Lark message for ${inbound.threadKey}`, err as Error);
      }
    };

    wsClient.start({
      eventDispatcher: new Lark.EventDispatcher({}).register({
        'im.message.receive_v1': async (data: never) => {
          await handle(mapLarkMessage(data));
        },
        'card.action.trigger': async (data: never) => {
          await handle(mapLarkCardAction(data));
          return undefined; // no in-place card update; we reply in thread instead
        },
      } as never),
    });
    this.pushRegistry.register('lark', async (ref, reply) => {
      const { msgType, content } = toLarkMessage(reply);
      await client.im.v1.message.reply({
        path: { message_id: ref.replyTo },
        data: { msg_type: msgType, content },
      });
    });
    this.logger.log('Lark adapter connected (WebSocket long connection)');
  }
}
