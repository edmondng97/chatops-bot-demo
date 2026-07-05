import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { FlowOrchestratorService } from './modules/flow/flow-orchestrator.service';
import { FlowRegistryService } from './modules/flow/flow-registry.service';
import { StepEngineService } from './modules/flow/step-engine.service';
import { SessionModule } from './modules/session/session.module';
import { SessionSweeperService } from './modules/session/session-sweeper.service';
import { QueueModule } from './modules/queue/queue.module';
import { SlackAdapterService } from './modules/channels/slack/slack-adapter.service';
import { LarkAdapterService } from './modules/channels/lark/lark-adapter.service';
import { ChannelsModule } from './modules/channels/channels.module';
import { WorkerModule } from './modules/worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost:27018/chatops'),
    BullModule.forRoot({
      connection: { host: process.env.REDIS_HOST ?? 'localhost', port: Number(process.env.REDIS_PORT ?? 6380) },
    }),
    SessionModule,
    ChannelsModule,
    WorkerModule,
    QueueModule,
  ],
  providers: [
    FlowOrchestratorService,
    FlowRegistryService,
    StepEngineService,
    SessionSweeperService,
    SlackAdapterService,
    LarkAdapterService,
  ],
})
export class AppModule {}
