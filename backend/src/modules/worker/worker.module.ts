import { Module } from '@nestjs/common';
import { ClaudeRunnerService } from './claude-runner.service';

@Module({
  providers: [ClaudeRunnerService],
  exports: [ClaudeRunnerService],
})
export class WorkerModule {}
