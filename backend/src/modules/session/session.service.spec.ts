import { SessionService } from './session.service';

describe('SessionService', () => {
  let svc: SessionService;
  beforeEach(() => (svc = new SessionService()));

  it('upserts one session per threadKey (thread isolation)', () => {
    const a = svc.upsert('tk1', 'diagnose', 'zh');
    const again = svc.upsert('tk1', 'diagnose', 'zh');
    expect(again).toBe(a);
    expect(svc.upsert('tk2', 'diagnose', 'en')).not.toBe(a);
    expect(a.state).toBe('ACTIVE');
  });

  it('close sets permanent CLOSED state', () => {
    svc.upsert('tk1', 'diagnose', 'zh');
    svc.close('tk1');
    expect(svc.get('tk1')!.state).toBe('CLOSED');
  });

  it('sweepIdle closes only stale ACTIVE sessions', () => {
    const s = svc.upsert('tk1', 'diagnose', 'zh');
    s.updatedAt = 1000;
    svc.save(s);
    const closed = svc.sweepIdle(5000, 10000);
    expect(closed).toEqual(['tk1']);
    expect(svc.get('tk1')!.state).toBe('CLOSED');
  });
});
