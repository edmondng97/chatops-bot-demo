import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SessionService } from './session.service';
import { ChannelPushRegistry } from '../channels/channel-push.registry';
import { Session } from '../../interfaces/session';

/** Full lifecycle sweep: idle ACTIVE → close; idle AWAITING_FEEDBACK → nag once, then close. */
@Injectable()
export class SessionSweeperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionSweeperService.name);
  static readonly IDLE_MS = Number(process.env.IDLE_MS ?? 2 * 60 * 60 * 1000);
  static readonly SWEEP_MS = Number(process.env.SWEEP_MS ?? 5 * 60 * 1000);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly sessions: SessionService, private readonly push: ChannelPushRegistry) {}

  onModuleInit(): void {
    this.timer = setInterval(() => { void this.sweepOnce(Date.now()).catch((e) => this.logger.error(String(e))); }, SessionSweeperService.SWEEP_MS);
    this.timer.unref?.();
  }
  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); }

  async sweepOnce(now: number): Promise<void> {
    const idle = SessionSweeperService.IDLE_MS;
    for (const s of await this.sessions.findIdle('ACTIVE', idle, now)) {
      await this.sessions.close(s.threadKey);
      await this.notify(s, s.locale === 'en' ? 'Session closed due to inactivity.' : '会话因长时间无活动已关闭。');
    }
    for (const s of await this.sessions.findIdle('AWAITING_FEEDBACK', idle, now)) {
      if (!s.nagSentAt) {
        await this.sessions.markNagged(s.threadKey, now);
        await this.notify(s, s.locale === 'en' ? 'Was the diagnosis helpful? Reply here — this session closes after 2 more hours of silence.' : '诊断结果有帮助吗？请在此回复——再无回应 2 小时后会话将关闭。');
      } else if (now - s.nagSentAt >= idle) {
        await this.sessions.close(s.threadKey);
        await this.notify(s, s.locale === 'en' ? 'Session closed. Thanks!' : '会话已关闭，感谢反馈！');
      }
    }
  }

  private async notify(s: Session, text: string): Promise<void> {
    try { await this.push.push(s.channel, s.threadRef, { kind: 'text', text }); }
    catch (err) { this.logger.warn(`sweep notify failed for ${s.threadKey}: ${String(err)}`); }
  }
}
