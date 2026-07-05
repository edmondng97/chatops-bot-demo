import { Module } from '@nestjs/common';
import { ChannelPushRegistry } from './channel-push.registry';

/** Shared singleton registry — imported by both the adapters (register) and QueueModule (push). */
@Module({
  providers: [ChannelPushRegistry],
  exports: [ChannelPushRegistry],
})
export class ChannelsModule {}
