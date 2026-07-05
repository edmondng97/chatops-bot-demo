import { Injectable } from '@nestjs/common';
import { ChannelKind, ThreadRef } from '../../interfaces/session';
import { OutboundReply } from '../flow/flow-orchestrator.service';

export type PushFn = (threadRef: ThreadRef, reply: OutboundReply) => Promise<void>;

/** Lets queue/sweeper code push to any channel without importing adapters (no reverse dependency). */
@Injectable()
export class ChannelPushRegistry {
  private readonly handlers = new Map<ChannelKind, PushFn>();
  register(kind: ChannelKind, fn: PushFn): void { this.handlers.set(kind, fn); }
  async push(kind: ChannelKind, threadRef: ThreadRef, reply: OutboundReply): Promise<void> {
    const fn = this.handlers.get(kind);
    if (!fn) throw new Error(`No push handler for channel: ${kind}`);
    await fn(threadRef, reply);
  }
}
