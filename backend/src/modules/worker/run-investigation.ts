import { Locale } from '../../interfaces/flow';

function parseJson(stdout: string): any | null {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

export function parseSessionId(stdout: string): string | null {
  const parsed = parseJson(stdout);
  return parsed?.session_id ?? null;
}

export function parseResult(stdout: string): string | null {
  const parsed = parseJson(stdout);
  return parsed?.result ?? null;
}

export function isWorkerSuccess(stdout: string): boolean {
  const parsed = parseJson(stdout);
  if (!parsed) return false;
  return parsed.is_error === false && parsed.subtype === 'success';
}

export function parseResultJson(result: string | null): any | null {
  if (!result) return null;
  const start = result.indexOf('{');
  const end = result.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(result.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function buildClaudeArgs(opts: { body: string; sessionId: string | null; bin: string }): string[] {
  const args = ['-p', opts.body, '--output-format', 'json'];
  if (opts.sessionId) {
    args.push('--resume', opts.sessionId);
  }
  args.push('--allowedTools', 'Read,Grep,Glob');
  return args;
}

export function buildInvestigationPrompt(opts: {
  skill: string;
  locale: Locale;
  collected: Record<string, unknown>;
  issue: string;
  grammar: string;
}): string {
  const ctx = Object.entries(opts.collected).map(([k, v]) => `${k}=${String(v)}`).join(' ');
  return [
    `You are the "${opts.skill}" investigation worker for this repository.`,
    `Context: ${ctx}`,
    `User issue: ${opts.issue}`,
    `Investigate READ-ONLY inside the current repository (the chatops bot itself) and produce a diagnosis.`,
    `Respond in ${opts.locale === 'en' ? 'English' : 'Chinese'}.`,
    `Output ONLY a JSON object matching this card grammar (no prose outside the JSON):`,
    opts.grammar, // CARD_GRAMMAR_PROMPT, passed in by the consumer (defined in Task 6; no import here keeps this task self-contained)
  ].join('\n');
}
