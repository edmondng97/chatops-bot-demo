import { buildClaudeArgs, isWorkerSuccess, parseResult, parseResultJson, parseSessionId } from './run-investigation';

describe('run-investigation helpers', () => {
  const ok = JSON.stringify({ session_id: 's1', result: 'hello', is_error: false, subtype: 'success' });
  it('parses session id and result', () => {
    expect(parseSessionId(ok)).toBe('s1');
    expect(parseResult(ok)).toBe('hello');
  });
  it('returns null on garbage stdout', () => {
    expect(parseSessionId('not json')).toBeNull();
    expect(parseResult('not json')).toBeNull();
  });
  it('success requires is_error=false AND subtype=success', () => {
    expect(isWorkerSuccess(ok)).toBe(true);
    expect(isWorkerSuccess(JSON.stringify({ is_error: true, subtype: 'success' }))).toBe(false);
    expect(isWorkerSuccess(JSON.stringify({ is_error: false, subtype: 'error_max_turns' }))).toBe(false);
    expect(isWorkerSuccess('garbage')).toBe(false);
  });
  it('extracts JSON from fenced/prose-wrapped result', () => {
    expect(parseResultJson('Here you go:\n```json\n{"a":1}\n```\nthanks')).toEqual({ a: 1 });
    expect(parseResultJson('no object here')).toBeNull();
    expect(parseResultJson(null)).toBeNull();
  });
  it('builds args with optional --resume', () => {
    expect(buildClaudeArgs({ body: 'p', sessionId: null, bin: 'claude' })).toEqual(['-p', 'p', '--output-format', 'json', '--allowedTools', 'Read,Grep,Glob']);
    expect(buildClaudeArgs({ body: 'p', sessionId: 's1', bin: 'claude' })).toContain('--resume');
  });
});
