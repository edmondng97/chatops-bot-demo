import { Locale } from '../flow';

export type SessionState = 'ACTIVE' | 'AWAITING_FEEDBACK' | 'CLOSED';

export interface Session {
  threadKey: string; // business key — one thread, one session (prod: MongoDB unique index)
  command: string;
  state: SessionState;
  locale: Locale;
  stepIndex: number;
  collected: Record<string, unknown>;
  updatedAt: number;
}
