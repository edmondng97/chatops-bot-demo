import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { INVESTIGATION_QUEUE } from '../../interfaces/queue';
import { InvestigationQueueService } from './investigation.queue';

@Module({
  imports: [BullModule.registerQueue({ name: INVESTIGATION_QUEUE })],
  providers: [InvestigationQueueService],
  exports: [InvestigationQueueService],
})
export class QueueModule {}
