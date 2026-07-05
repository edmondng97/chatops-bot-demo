import { Module } from '@nestjs/common';
import { GatewayController } from './modules/gateway/gateway.controller';
import { FlowOrchestratorService } from './modules/flow/flow-orchestrator.service';
import { FlowRegistryService } from './modules/flow/flow-registry.service';
import { StepEngineService } from './modules/flow/step-engine.service';
import { SessionService } from './modules/session/session.service';
import { SessionSweeperService } from './modules/session/session-sweeper.service';
import { WorkerService } from './modules/worker/worker.service';
import { SlackAdapterService } from './modules/channels/slack/slack-adapter.service';
import { LarkAdapterService } from './modules/channels/lark/lark-adapter.service';

@Module({
  controllers: [GatewayController],
  providers: [
    FlowOrchestratorService,
    FlowRegistryService,
    StepEngineService,
    SessionService,
    SessionSweeperService,
    WorkerService,
    SlackAdapterService,
    LarkAdapterService,
  ],
})
export class AppModule {}
