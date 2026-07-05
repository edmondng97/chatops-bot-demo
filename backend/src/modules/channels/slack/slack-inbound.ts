import { InboundMessage } from '../channel.types';

export type SlackMessageEvent = {
  channel: string;
  ts: string;
  thread_ts?: string;
  text?: string;
  bot_id?: string;
  subtype?: string;
};

export type SlackActionPayload = {
  channel: string;
  threadTs: string;
  actionId: string;
  value?: string;
  blockId?: string;
};

export function threadKeyOf(channel: string, ts: string): string {
  return `${channel}:${ts}`;
}

export function mapSlackMessage(event: SlackMessageEvent): InboundMessage | null {
  if (event.bot_id || event.subtype) return null; // loop guard / edits
  const text = (event.text ?? '').replace(/^<@[^>]+>\s*/, '').trim();
  if (!text) return null;
  return { threadKey: threadKeyOf(event.channel, event.thread_ts ?? event.ts), text };
}

export function mapSlackAction(payload: SlackActionPayload): InboundMessage | null {
  const threadKey = threadKeyOf(payload.channel, payload.threadTs);
  try {
    if (payload.actionId === 'card_input') {
      const base = JSON.parse(payload.blockId ?? '{}') as Record<string, unknown>;
      return { threadKey, action: { ...base, value: payload.value ?? '' } };
    }
    return { threadKey, action: JSON.parse(payload.value ?? '') as Record<string, unknown> };
  } catch {
    return null; // malformed payload — ignore rather than crash the socket
  }
}
