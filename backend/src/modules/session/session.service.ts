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

  // Hand-builds a domain Session from a lean doc, keeping Mongo internals (_id, __v) out of it.
  private toSession(doc: SessionDoc): Session {
    return {
      threadKey: doc.threadKey,
      channel: doc.channel as ChannelKind,
      threadRef: doc.threadRef as ThreadRef,
      command: doc.command,
      state: doc.state as SessionState,
      locale: doc.locale as Locale,
      stepIndex: doc.stepIndex,
      collected: doc.collected,
      updatedAt: doc.updatedAt,
      nagSentAt: doc.nagSentAt,
      claudeSessionId: doc.claudeSessionId,
    };
  }

  async upsert(threadKey: string, command: string, locale: Locale, channel: ChannelKind, threadRef: ThreadRef): Promise<Session> {
    const doc = await this.model.findOneAndUpdate(
      { threadKey },
      { $setOnInsert: { threadKey, command, locale, channel, threadRef, state: 'ACTIVE', stepIndex: 0, collected: {}, updatedAt: Date.now() } },
      { new: true, upsert: true },
    ).lean();
    return this.toSession(doc as SessionDoc);
  }

  async get(threadKey: string): Promise<Session | undefined> {
    const doc = await this.model.findOne({ threadKey }).lean();
    return doc ? this.toSession(doc as SessionDoc) : undefined;
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
    const docs = await this.model.find({ state, updatedAt: { $lte: now - idleMs } }).lean();
    return docs.map((doc) => this.toSession(doc as SessionDoc));
  }

  async markNagged(threadKey: string, now: number): Promise<void> {
    await this.model.updateOne({ threadKey }, { $set: { nagSentAt: now } });
  }

  // Persists the claude CLI session id so follow-up investigations in the same thread resume it.
  async setClaudeSession(threadKey: string, claudeSessionId: string): Promise<void> {
    await this.model.updateOne({ threadKey }, { $set: { claudeSessionId } });
  }

  // Clears the nag stamp so the next idle period starts a fresh nag→close cycle
  // (e.g. after delivering a new report into a session that was nagged before).
  async clearNag(threadKey: string): Promise<void> {
    await this.model.updateOne({ threadKey }, { $unset: { nagSentAt: 1 } });
  }
}
