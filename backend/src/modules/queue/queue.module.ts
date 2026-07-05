import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { INVESTIGATION_QUEUE } from '../../interfaces/queue';
import { InvestigationQueueService } from './investigation.queue';
import { InvestigationConsumer } from './investigation.consumer';
import { SessionModule } from '../session/session.module';
import { ChannelsModule } from '../channels/channels.module';
import { WorkerModule } from '../worker/worker.module';

@Module({
  imports: [BullModule.registerQueue({ name: INVESTIGATION_QUEUE }), SessionModule, ChannelsModule, WorkerModule],
  providers: [InvestigationQueueService, InvestigationConsumer],
  exports: [InvestigationQueueService],
})
export class QueueModule {}
