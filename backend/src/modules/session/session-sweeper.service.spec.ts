import { Test } from '@nestjs/testing';
import { SessionSweeperService } from './session-sweeper.service';
import { SessionService } from './session.service';
import { ChannelPushRegistry } from '../channels/channel-push.registry';

describe('SessionSweeperService.sweepOnce', () => {
  const NOW = 10_000_000;
  const IDLE = 2 * 60 * 60 * 1000;
  const base = { threadKey: 't', channel: 'slack', threadRef: { channel: 'C', threadTs: '1' }, locale: 'en' };

  let sweeper: SessionSweeperService;
  let sessions: { findIdle: jest.Mock; markNagged: jest.Mock; close: jest.Mock };
  let push: { push: jest.Mock };

  beforeEach(async () => {
    sessions = { findIdle: jest.fn().mockResolvedValue([]), markNagged: jest.fn(), close: jest.fn() };
    push = { push: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SessionSweeperService,
        { provide: SessionService, useValue: sessions },
        { provide: ChannelPushRegistry, useValue: push },
      ],
    }).compile();

    sweeper = moduleRef.get(SessionSweeperService);
  });

  it('idle ACTIVE session → closed with notice', async () => {
    sessions.findIdle.mockImplementation(async (state: string) => (state === 'ACTIVE' ? [base] : []));
    await sweeper.sweepOnce(NOW);
    expect(sessions.close).toHaveBeenCalledWith('t');
    expect(push.push).toHaveBeenCalledWith('slack', base.threadRef, expect.objectContaining({ kind: 'text' }));
  });

  it('idle AWAITING_FEEDBACK without nag → nag sent + stamped, NOT closed', async () => {
    sessions.findIdle.mockImplementation(async (state: string) => (state === 'AWAITING_FEEDBACK' ? [base] : []));
    await sweeper.sweepOnce(NOW);
    expect(sessions.markNagged).toHaveBeenCalledWith('t', NOW);
    expect(sessions.close).not.toHaveBeenCalled();
  });

  it('nagged and idle again → closed', async () => {
    const nagged = { ...base, nagSentAt: NOW - IDLE - 1 };
    sessions.findIdle.mockImplementation(async (state: string) => (state === 'AWAITING_FEEDBACK' ? [nagged] : []));
    await sweeper.sweepOnce(NOW);
    expect(sessions.close).toHaveBeenCalledWith('t');
  });

  it('nagged recently → left alone', async () => {
    const nagged = { ...base, nagSentAt: NOW - 1000 };
    sessions.findIdle.mockImplementation(async (state: string) => (state === 'AWAITING_FEEDBACK' ? [nagged] : []));
    await sweeper.sweepOnce(NOW);
    expect(sessions.close).not.toHaveBeenCalled();
    expect(sessions.markNagged).not.toHaveBeenCalled();
  });

  it('push failure does not abort the sweep round', async () => {
    push.push.mockRejectedValue(new Error('down'));
    sessions.findIdle.mockImplementation(async (state: string) => (state === 'ACTIVE' ? [base] : []));
    await expect(sweeper.sweepOnce(NOW)).resolves.toBeUndefined();
    expect(sessions.close).toHaveBeenCalled();
  });
});
