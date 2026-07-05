import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SessionService } from './session.service';

/** Periodically closes idle ACTIVE sessions (mirrors the production 5-minute sweep). */
@Injectable()
export class SessionSweeperService implements OnModuleInit, OnModuleDestroy {
  private static readonly IDLE_MS = 2 * 60 * 60 * 1000; // 2h
  private static readonly TICK_MS = 5 * 60 * 1000; // 5m
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly sessions: SessionService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      // TODO: Task 8 rewrites this to cover AWAITING_FEEDBACK nagging + full idle policy.
      void this.sweep();
    }, SessionSweeperService.TICK_MS);
    this.timer.unref?.();
  }

  private async sweep(): Promise<void> {
    const idle = await this.sessions.findIdle('ACTIVE', SessionSweeperService.IDLE_MS, Date.now());
    for (const s of idle) await this.sessions.close(s.threadKey);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
