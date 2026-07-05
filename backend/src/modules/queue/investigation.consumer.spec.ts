import { InvestigationConsumer } from './investigation.consumer';

describe('InvestigationConsumer.process', () => {
  let sessions: { setState: jest.Mock };
  let push: { push: jest.Mock };
  let runner: { run: jest.Mock };
  let consumer: InvestigationConsumer;

  const job = { data: { threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, locale: 'en', skill: 'diagnose-worker', collected: { env: 'uat' }, issue: 'pay fails' } };
  const okStdout = (result: string) => JSON.stringify({ session_id: 's1', result, is_error: false, subtype: 'success' });

  beforeEach(() => {
    sessions = { setState: jest.fn().mockResolvedValue(undefined) };
    push = { push: jest.fn().mockResolvedValue(undefined) };
    runner = { run: jest.fn() };
    consumer = new InvestigationConsumer(sessions as any, push as any, runner as any);
  });

  it('happy path: valid card → push card, session AWAITING_FEEDBACK', async () => {
    runner.run.mockResolvedValue({ stdout: okStdout('{"title":"D","blocks":[{"type":"text","text":"x"}]}'), ok: true });
    await consumer.process(job as any);
    expect(push.push).toHaveBeenCalledWith('slack', job.data.threadRef, expect.objectContaining({ kind: 'card' }));
    expect(sessions.setState).toHaveBeenCalledWith('t', 'AWAITING_FEEDBACK');
  });

  it('invalid card → repair with --resume once, then success', async () => {
    runner.run
      .mockResolvedValueOnce({ stdout: okStdout('{"title":"D","blocks":[{"type":"image","text":"x"}]}'), ok: true })
      .mockResolvedValueOnce({ stdout: okStdout('{"title":"D","blocks":[{"type":"text","text":"x"}]}'), ok: true });
    await consumer.process(job as any);
    expect(runner.run).toHaveBeenCalledTimes(2);
    expect(runner.run.mock.calls[1][1]).toBe('s1'); // resumed same session
    expect(push.push).toHaveBeenCalledWith('slack', expect.anything(), expect.objectContaining({ kind: 'card' }));
  });

  it('repair exhausted → degrade to plain text with raw result', async () => {
    const bad = okStdout('{"title":"D","blocks":[{"type":"image","text":"x"}]}');
    runner.run.mockResolvedValue({ stdout: bad, ok: true });
    await consumer.process(job as any);
    expect(runner.run).toHaveBeenCalledTimes(3); // initial + MAX_REPAIR(2)
    expect(push.push).toHaveBeenCalledWith('slack', expect.anything(), expect.objectContaining({ kind: 'text' }));
    expect(sessions.setState).toHaveBeenCalledWith('t', 'AWAITING_FEEDBACK');
  });

  it('worker failure → error card, session back to ACTIVE', async () => {
    runner.run.mockResolvedValue({ stdout: '', ok: false });
    await consumer.process(job as any);
    expect(push.push).toHaveBeenCalledWith('slack', expect.anything(), { kind: 'text', text: expect.stringContaining('failed') });
    expect(sessions.setState).toHaveBeenCalledWith('t', 'ACTIVE');
  });

  it('push failure does not throw (sweeper will reap the session)', async () => {
    runner.run.mockResolvedValue({ stdout: okStdout('{"title":"D","blocks":[{"type":"text","text":"x"}]}'), ok: true });
    push.push.mockRejectedValue(new Error('api down'));
    await expect(consumer.process(job as any)).resolves.toBeUndefined();
    expect(sessions.setState).toHaveBeenCalledWith('t', 'AWAITING_FEEDBACK');
  });
});
