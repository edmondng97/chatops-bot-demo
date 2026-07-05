import { Locale } from '../flow';
import { ChannelKind, ThreadRef } from '../session';

export const INVESTIGATION_QUEUE = 'investigation';

export interface InvestigationJob {
  threadKey: string;
  channel: ChannelKind;
  threadRef: ThreadRef;
  locale: Locale;
  skill: string;
  collected: Record<string, unknown>;
  issue: string;
}
