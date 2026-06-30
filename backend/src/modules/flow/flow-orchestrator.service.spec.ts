import { StepEngineService } from './step-engine.service';
import { SessionService } from '../session/session.service';
import { WorkerService } from '../worker/worker.service';
import { FlowRegistryService } from './flow-registry.service';
import { FlowOrchestratorService } from './flow-orchestrator.service';

function build() {
  const registry = new FlowRegistryService();
  const orch = new FlowOrchestratorService(
    registry,
    new StepEngineService(),
    new SessionService(),
    new WorkerService(),
  );
  return orch;
}

describe('FlowOrchestratorService', () => {
  it('keyword triggers the first wizard step as a card', async () => {
    const reply = await build().handle({ threadKey: 'tk1', text: '诊断' });
    expect(reply.kind).toBe('card');
    if (reply.kind === 'card') expect(reply.card.header.title).toContain('环境');
  });

  it('runs a full wizard then dispatches to the worker', async () => {
    const orch = build();
    await orch.handle({ threadKey: 'tk1', text: 'diagnose' }); // -> env card
    await orch.handle({ threadKey: 'tk1', action: { stepId: 'env', value: 'uat' } }); // -> branch card
    await orch.handle({ threadKey: 'tk1', action: { stepId: 'branch', value: 'main' } }); // -> enters conversation
    const reply = await orch.handle({ threadKey: 'tk1', text: 'request failed' }); // free text -> worker
    expect(reply.kind).toBe('text');
    if (reply.kind === 'text') {
      expect(reply.text).toContain('uat');
      expect(reply.text).toContain('main');
    }
  });
});
