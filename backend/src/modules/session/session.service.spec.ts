import { Test } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { SessionService } from './session.service';
import { SessionDoc, SessionSchema } from './session.schema';

describe('SessionService (mongo)', () => {
  let mongod: MongoMemoryServer; let svc: SessionService; let moduleRef: any;
  const ref = { channel: 'C1', threadTs: '1.0' };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([{ name: SessionDoc.name, schema: SessionSchema }]),
      ],
      providers: [SessionService],
    }).compile();
    svc = moduleRef.get(SessionService);
  });
  afterAll(async () => { await moduleRef.close(); await mongod.stop(); });

  it('upsert creates once and is idempotent', async () => {
    const a = await svc.upsert('t1', 'diagnose', 'en', 'slack', ref);
    const b = await svc.upsert('t1', 'diagnose', 'en', 'slack', ref);
    expect(a.state).toBe('ACTIVE');
    expect(b.threadKey).toBe('t1');
  });

  it('save persists collected/stepIndex across get', async () => {
    const s = await svc.upsert('t2', 'diagnose', 'en', 'slack', ref);
    s.collected.env = 'uat'; s.stepIndex = 1;
    await svc.save(s);
    const got = await svc.get('t2');
    expect(got?.collected.env).toBe('uat');
    expect(got?.stepIndex).toBe(1);
  });

  it('findIdle returns only sessions in state idle beyond threshold', async () => {
    const s = await svc.upsert('t3', 'diagnose', 'en', 'slack', ref);
    await svc.setState('t3', 'AWAITING_FEEDBACK');
    const now = Date.now() + 3 * 60 * 60 * 1000; // 3h later
    const idle = await svc.findIdle('AWAITING_FEEDBACK', 2 * 60 * 60 * 1000, now);
    expect(idle.map((x) => x.threadKey)).toContain('t3');
    expect(await svc.findIdle('AWAITING_FEEDBACK', 2 * 60 * 60 * 1000, Date.now())).toEqual([]);
  });

  it('markNagged stamps nagSentAt', async () => {
    await svc.upsert('t4', 'diagnose', 'en', 'slack', ref);
    await svc.markNagged('t4', 123);
    expect((await svc.get('t4'))?.nagSentAt).toBe(123);
  });
});
