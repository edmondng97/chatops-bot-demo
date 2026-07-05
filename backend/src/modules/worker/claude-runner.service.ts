import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { buildClaudeArgs } from './run-investigation';

@Injectable()
export class ClaudeRunnerService {
  private readonly logger = new Logger(ClaudeRunnerService.name);

  run(body: string, sessionId: string | null): Promise<{ stdout: string; ok: boolean }> {
    const timeout = Number(process.env.WORKER_TIMEOUT_MS ?? 300_000);
    const args = buildClaudeArgs({ body, sessionId, bin: 'claude' });
    const cwd = process.env.WORKER_CWD ?? process.cwd();
    return new Promise((resolve) => {
      execFile('claude', args, { cwd, timeout, maxBuffer: 10 * 1024 * 1024, killSignal: 'SIGKILL' }, (err, stdout) => {
        if (err && !stdout) {
          this.logger.error(`claude spawn failed: ${String(err)}`);
          resolve({ stdout: '', ok: false });
          return;
        }
        resolve({ stdout, ok: !err });
      });
    });
  }
}
