import { ChannelPushRegistry } from './channel-push.registry';

describe('ChannelPushRegistry', () => {
  it('routes push to the registered handler', async () => {
    const reg = new ChannelPushRegistry();
    const calls: unknown[] = [];
    reg.register('slack', async (ref, reply) => { calls.push([ref, reply]); });
    await reg.push('slack', { channel: 'C1', threadTs: '1.0' }, { kind: 'text', text: 'hi' });
    expect(calls).toHaveLength(1);
  });
  it('rejects for unregistered channel', async () => {
    await expect(new ChannelPushRegistry().push('lark', {}, { kind: 'text', text: 'x' }))
      .rejects.toThrow('No push handler for channel: lark');
  });
});
