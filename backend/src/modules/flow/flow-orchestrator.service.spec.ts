import { StepEngineService } from './step-engine.service';
import { WorkerService } from '../worker/worker.service';
import { FlowRegistryService } from './flow-registry.service';
import { FlowOrchestratorService } from './flow-orchestrator.service';
import { Session } from '../../interfaces/session';

/** In-memory stand-in for the Mongo-backed SessionService, matching its async API. */
class FakeSessionService {
  private readonly byThread = new Map<string, Session>();

  async upsert(threadKey: string, command: string, locale: Session['locale'], channel: Session['channel'], threadRef: Session['threadRef']): Promise<Session> {
    const existing = this.byThread.get(threadKey);
    if (existing) return existing;
    const session: Session = { threadKey, channel, threadRef, command, state: 'ACTIVE', locale, stepIndex: 0, collected: {}, updatedAt: Date.now() };
    this.byThread.set(threadKey, session);
    return session;
  }

  async get(threadKey: string): Promise<Session | undefined> {
    return this.byThread.get(threadKey);
  }

  async save(session: Session): Promise<void> {
    this.byThread.set(session.threadKey, session);
  }

  async close(threadKey: string): Promise<void> {
    const s = this.byThread.get(threadKey);
    if (s) s.state = 'CLOSED';
  }
}

function build() {
  const registry = new FlowRegistryService();
  const orch = new FlowOrchestratorService(
    registry,
    new StepEngineService(),
    new FakeSessionService() as any,
    new WorkerService(),
  );
  return orch;
}

describe('FlowOrchestratorService', () => {
  it('keyword triggers the first wizard step as a card', async () => {
    const reply = await build().handle({ threadKey: 'tk1', channel: 'slack', threadRef: {}, text: '诊断' });
    expect(reply.kind).toBe('card');
    if (reply.kind === 'card') expect(reply.card.header.title).toContain('环境');
  });

  it('runs a full wizard then dispatches to the worker', async () => {
    const orch = build();
    await orch.handle({ threadKey: 'tk1', channel: 'slack', threadRef: {}, text: 'diagnose' }); // -> env card
    await orch.handle({ threadKey: 'tk1', channel: 'slack', threadRef: {}, action: { stepId: 'env', value: 'uat' } }); // -> branch card
    await orch.handle({ threadKey: 'tk1', channel: 'slack', threadRef: {}, action: { stepId: 'branch', value: 'main' } }); // -> enters conversation
    const reply = await orch.handle({ threadKey: 'tk1', channel: 'slack', threadRef: {}, text: 'request failed' }); // free text -> worker
    expect(reply.kind).toBe('text');
    if (reply.kind === 'text') {
      expect(reply.text).toContain('uat');
      expect(reply.text).toContain('main');
    }
  });
});
