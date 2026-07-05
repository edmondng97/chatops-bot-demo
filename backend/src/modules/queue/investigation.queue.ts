import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INVESTIGATION_QUEUE, InvestigationJob } from '../../interfaces/queue';

@Injectable()
export class InvestigationQueueService {
  constructor(@InjectQueue(INVESTIGATION_QUEUE) private readonly queue: Queue) {}

  /** attempts: 1 — a failed investigation is reported, never silently re-run (token cost). */
  async enqueue(job: InvestigationJob): Promise<void> {
    await this.queue.add('investigate', job, { attempts: 1 });
  }
}
