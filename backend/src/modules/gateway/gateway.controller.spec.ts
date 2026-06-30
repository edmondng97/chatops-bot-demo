import { Test } from '@nestjs/testing';
import { GatewayController } from './gateway.controller';
import { FlowOrchestratorService } from '../flow/flow-orchestrator.service';
import { FlowRegistryService } from '../flow/flow-registry.service';
import { StepEngineService } from '../flow/step-engine.service';
import { SessionService } from '../session/session.service';
import { WorkerService } from '../worker/worker.service';

describe('GatewayController', () => {
  it('routes an inbound message to a wizard card', async () => {
    const mod = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [
        FlowOrchestratorService, FlowRegistryService, StepEngineService,
        SessionService, WorkerService,
      ],
    }).compile();
    const ctrl = mod.get(GatewayController);
    const reply = await ctrl.message({ threadKey: 'tk1', text: 'diagnose' });
    expect(reply.kind).toBe('card');
  });
});
