import { Injectable } from '@nestjs/common';
import { Locale } from '../../interfaces/flow';
import { Session } from '../../interfaces/session';

/**
 * In-memory session store. In production this is a MongoDB `sessions` collection
 * keyed by a unique `threadKey` index (upsert per thread); CLOSED sessions are
 * retained permanently to feed a future learning loop. State never degrades to files.
 */
@Injectable()
export class SessionService {
  private readonly byThread = new Map<string, Session>();

  upsert(threadKey: string, command: string, locale: Locale): Session {
    const existing = this.byThread.get(threadKey);
    if (existing) return existing;
    const session: Session = {
      threadKey,
      command,
      state: 'ACTIVE',
      locale,
      stepIndex: 0,
      collected: {},
      updatedAt: this.now(),
    };
    this.byThread.set(threadKey, session);
    return session;
  }

  get(threadKey: string): Session | undefined {
    return this.byThread.get(threadKey);
  }

  save(session: Session): void {
    this.byThread.set(session.threadKey, session);
  }

  close(threadKey: string): void {
    const s = this.byThread.get(threadKey);
    if (s) s.state = 'CLOSED'; // permanent terminal state
  }

  /** Close ACTIVE sessions idle longer than maxIdleMs. Returns the closed keys. */
  sweepIdle(maxIdleMs: number, now: number): string[] {
    const closed: string[] = [];
    for (const s of this.byThread.values()) {
      if (s.state === 'ACTIVE' && now - s.updatedAt >= maxIdleMs) {
        s.state = 'CLOSED';
        closed.push(s.threadKey);
      }
    }
    return closed;
  }

  private now(): number {
    return Date.now();
  }
}
