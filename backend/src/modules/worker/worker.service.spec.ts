import { WorkerService } from './worker.service';

describe('WorkerService (mock brain)', () => {
  it('returns a structured report string referencing collected context', async () => {
    const svc = new WorkerService();
    const out = await svc.run({
      skill: 'diagnose-orchestrator',
      locale: 'zh',
      collected: { env: 'uat', branch: 'main' },
      prompt: '玩家请求失败',
    });
    expect(out.result).toContain('uat');
    expect(out.result).toContain('main');
    expect(out.result.length).toBeGreaterThan(20);
  });
});
