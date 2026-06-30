import { Injectable } from '@nestjs/common';
import { WorkerRequest, WorkerResult } from '../../interfaces/worker';

/**
 * Mock "AI worker". In production this spawns a short-lived `claude -p` subprocess
 * with the repo root as cwd, runs the named skill, and returns its final stdout
 * `result`. The worker is a pure brain: it never touches the IM channel — the broker
 * reads this result and sends it back to the thread. A crash here kills only itself.
 */
@Injectable()
export class WorkerService {
  async run(req: WorkerRequest): Promise<WorkerResult> {
    await this.simulateLatency();
    const env = String(req.collected.env ?? '?');
    const branch = String(req.collected.branch ?? '?');
    const report =
      req.locale === 'en'
        ? `[mock report] env=${env} branch=${branch}\nIssue: "${req.prompt}"\nRoot cause (mock): null credit returned by upstream service. Confidence 82%.`
        : `[模拟报告] 环境=${env} 分支=${branch}\n问题：「${req.prompt}」\n根因（模拟）：上游服务返回空额度。置信度 82%。`;
    return { result: report };
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 10));
  }
}
