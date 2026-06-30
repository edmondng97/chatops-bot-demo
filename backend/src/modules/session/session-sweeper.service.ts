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
      this.sessions.sweepIdle(SessionSweeperService.IDLE_MS, Date.now());
    }, SessionSweeperService.TICK_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
