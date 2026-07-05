import { StepEngineService } from './step-engine.service';
import { FlowRegistryService } from './flow-registry.service';
import { FlowOrchestratorService } from './flow-orchestrator.service';
import { Session } from '../../interfaces/session';
import { InvestigationQueueService } from '../queue/investigation.queue';

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

  async setState(threadKey: string, state: Session['state']): Promise<void> {
    const s = this.byThread.get(threadKey);
    if (s) s.state = state;
  }

  async close(threadKey: string): Promise<void> {
    await this.setState(threadKey, 'CLOSED');
  }
}

function build() {
  const registry = new FlowRegistryService();
  const sessions = new FakeSessionService();
  const queue = { enqueue: jest.fn() } as unknown as jest.Mocked<InvestigationQueueService>;
  const orch = new FlowOrchestratorService(registry, new StepEngineService(), sessions as any, queue);
  return { orch, sessions, queue };
}

describe('FlowOrchestratorService', () => {
  it('keyword triggers the first wizard step as a card', async () => {
    const reply = await build().orch.handle({ threadKey: 'tk1', channel: 'slack', threadRef: {}, text: '诊断' });
    expect(reply.kind).toBe('card');
    if (reply.kind === 'card') expect(reply.card.header.title).toContain('环境');
  });

  it('runs a full wizard then enqueues an investigation and acknowledges', async () => {
    const { orch, sessions, queue } = build();
    await orch.handle({ threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, text: 'diagnose' }); // -> env card
    await orch.handle({ threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, action: { stepId: 'env', value: 'uat' } }); // -> branch card
    await orch.handle({ threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, action: { stepId: 'branch', value: 'main' } }); // -> enters conversation
    const setStateSpy = jest.spyOn(sessions, 'setState');

    const reply = await orch.handle({ threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, text: 'payment fails' });

    expect(queue.enqueue).toHaveBeenCalledWith(expect.objectContaining({ issue: 'payment fails', skill: 'diagnose-orchestrator' }));
    expect(setStateSpy).toHaveBeenCalledWith('t', 'INVESTIGATING');
    expect(reply).toEqual({ kind: 'text', text: expect.stringContaining('Investigating') });
  });

  it('guards against duplicate enqueue while already INVESTIGATING', async () => {
    const { orch, sessions, queue } = build();
    await orch.handle({ threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, text: 'diagnose' });
    await orch.handle({ threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, action: { stepId: 'env', value: 'uat' } });
    await orch.handle({ threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, action: { stepId: 'branch', value: 'main' } });
    await orch.handle({ threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, text: 'payment fails' }); // -> enqueues, sets INVESTIGATING
    queue.enqueue.mockClear();

    const reply = await orch.handle({ threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, text: 'another message' });

    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(reply).toEqual({ kind: 'text', text: expect.stringContaining('Investigation in progress') });
    expect((await sessions.get('t'))?.state).toBe('INVESTIGATING');
  });
});
