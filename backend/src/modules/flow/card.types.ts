import { Locale } from '../../interfaces/flow';

/** A minimal IM card abstraction — desensitized stand-in for a real IM card payload. */
export interface CardAction {
  text: string;
  value: Record<string, unknown>;
}

export type CardBlock =
  | { type: 'note'; text: string }
  | { type: 'buttons'; actions: CardAction[] }
  | { type: 'input'; placeholder: string; submit: string; value: Record<string, unknown> }
  | { type: 'text'; text: string };

export interface CardSpec {
  header: { title: string; color: string };
  blocks: CardBlock[];
  locale?: Locale;
}
