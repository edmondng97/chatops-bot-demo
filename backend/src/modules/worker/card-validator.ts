import { Locale } from '../../interfaces/flow';
import { OutboundReply } from '../flow/flow-orchestrator.service';

const ALLOWED = new Set(['text', 'note']);

export const CARD_GRAMMAR_PROMPT = [
  '{ "title": string, "blocks": [ { "type": "text" | "note", "text": string }, ... ] }',
  'Use EXACTLY these block types (no others). "text" for findings, "note" for caveats/confidence.',
  'blocks must be non-empty. Output nothing outside the JSON object.',
].join('\n');

export interface WorkerCard { title: string; blocks: Array<{ type: 'text' | 'note'; text: string }> }

export function validateWorkerCard(json: any): { ok: true; card: WorkerCard } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!json || typeof json !== 'object') return { ok: false, errors: ['output is not a JSON object'] };
  if (typeof json.title !== 'string' || !json.title.trim()) errors.push('missing or empty "title"');
  if (!Array.isArray(json.blocks) || json.blocks.length === 0) errors.push('"blocks" must be a non-empty array');
  else for (const [i, b] of json.blocks.entries()) {
    if (!b || !ALLOWED.has(b.type)) errors.push(`blocks[${i}]: bad type: ${String(b?.type)}`);
    else if (typeof b.text !== 'string' || !b.text.trim()) errors.push(`blocks[${i}]: missing text`);
  }
  return errors.length ? { ok: false, errors } : { ok: true, card: json as WorkerCard };
}

export function buildRepairPrompt(errors: string[]): string {
  return ['Your previous output failed card validation:', ...errors.map((e) => `- ${e}`),
    '', 'Re-emit the corrected JSON only. Use EXACTLY this grammar:', CARD_GRAMMAR_PROMPT].join('\n');
}

export function toReportReply(card: WorkerCard, locale: Locale): OutboundReply {
  return { kind: 'card', card: { header: { title: card.title, color: 'turquoise' }, blocks: card.blocks, locale } };
}
