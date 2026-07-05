import { Locale } from '../flow';

export type SessionState = 'ACTIVE' | 'INVESTIGATING' | 'AWAITING_FEEDBACK' | 'CLOSED';
export type ChannelKind = 'slack' | 'lark';
export interface ThreadRef {
  [k: string]: string; // slack: {channel, threadTs}; lark: {replyTo}
}

export interface Session {
  threadKey: string; // business key — one thread, one session (MongoDB unique index)
  channel: ChannelKind;
  threadRef: ThreadRef;
  command: string;
  state: SessionState;
  locale: Locale;
  stepIndex: number;
  collected: Record<string, unknown>;
  updatedAt: number; // ms epoch; doubles as lastActivityAt for the sweeper
  nagSentAt?: number; // ms epoch; sweeper nag dedupe
}
