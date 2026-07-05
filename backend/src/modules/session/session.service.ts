import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Locale } from '../../interfaces/flow';
import { ChannelKind, Session, SessionState, ThreadRef } from '../../interfaces/session';
import { SessionDoc } from './session.schema';

/**
 * MongoDB-backed session store. One thread = one session (unique threadKey index).
 * CLOSED sessions are retained permanently to feed a future learning loop.
 */
@Injectable()
export class SessionService {
  constructor(@InjectModel(SessionDoc.name) private readonly model: Model<SessionDoc>) {}

  async upsert(threadKey: string, command: string, locale: Locale, channel: ChannelKind, threadRef: ThreadRef): Promise<Session> {
    const doc = await this.model.findOneAndUpdate(
      { threadKey },
      { $setOnInsert: { threadKey, command, locale, channel, threadRef, state: 'ACTIVE', stepIndex: 0, collected: {}, updatedAt: Date.now() } },
      { new: true, upsert: true },
    ).lean();
    return doc as unknown as Session;
  }

  async get(threadKey: string): Promise<Session | undefined> {
    const doc = await this.model.findOne({ threadKey }).lean();
    return (doc ?? undefined) as Session | undefined;
  }

  async save(session: Session): Promise<void> {
    session.updatedAt = Date.now();
    const { threadKey, ...rest } = session;
    await this.model.updateOne({ threadKey }, { $set: rest });
  }

  async setState(threadKey: string, state: SessionState): Promise<void> {
    await this.model.updateOne({ threadKey }, { $set: { state, updatedAt: Date.now() } });
  }

  async close(threadKey: string): Promise<void> {
    await this.setState(threadKey, 'CLOSED');
  }

  async findIdle(state: SessionState, idleMs: number, now: number): Promise<Session[]> {
    return (await this.model.find({ state, updatedAt: { $lte: now - idleMs } }).lean()) as unknown as Session[];
  }

  async markNagged(threadKey: string, now: number): Promise<void> {
    await this.model.updateOne({ threadKey }, { $set: { nagSentAt: now } });
  }
}
