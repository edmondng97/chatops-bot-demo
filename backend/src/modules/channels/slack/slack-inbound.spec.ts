import { mapSlackAction, mapSlackMessage } from './slack-inbound';

describe('mapSlackMessage', () => {
  it('maps a plain message; threadKey = channel:ts when no thread', () => {
    expect(mapSlackMessage({ channel: 'C1', ts: '111.1', text: 'diagnose' })).toEqual({
      threadKey: 'C1:111.1',
      channel: 'slack',
      threadRef: {},
      text: 'diagnose',
    });
  });

  it('uses thread_ts when replying inside a thread', () => {
    expect(mapSlackMessage({ channel: 'C1', ts: '222.2', thread_ts: '111.1', text: 'hi' })).toEqual({
      threadKey: 'C1:111.1',
      channel: 'slack',
      threadRef: {},
      text: 'hi',
    });
  });

  it('strips leading bot mention from app_mention text', () => {
    expect(mapSlackMessage({ channel: 'C1', ts: '1.1', text: '<@U0BOT> diagnose' })!.text).toBe('diagnose');
  });

  it('ignores bot messages and subtypes (loop guard)', () => {
    expect(mapSlackMessage({ channel: 'C1', ts: '1.1', text: 'x', bot_id: 'B1' })).toBeNull();
    expect(mapSlackMessage({ channel: 'C1', ts: '1.1', text: 'x', subtype: 'message_changed' })).toBeNull();
    expect(mapSlackMessage({ channel: 'C1', ts: '1.1' })).toBeNull();
  });
});

describe('mapSlackAction', () => {
  it('parses button value JSON into action', () => {
    const value = JSON.stringify({ stepId: 'env', tk: 't1', namespace: 'wizard', value: 'prod' });
    expect(
      mapSlackAction({ channel: 'C1', threadTs: '111.1', actionId: 'card_button_0', value }),
    ).toEqual({
      threadKey: 'C1:111.1',
      channel: 'slack',
      threadRef: {},
      action: { stepId: 'env', tk: 't1', namespace: 'wizard', value: 'prod' },
    });
  });

  it('merges typed text into base value for input dispatch', () => {
    const blockId = JSON.stringify({ stepId: 'svc', tk: 't1', namespace: 'wizard' });
    expect(
      mapSlackAction({ channel: 'C1', threadTs: '111.1', actionId: 'card_input', value: 'api-gw', blockId }),
    ).toEqual({
      threadKey: 'C1:111.1',
      channel: 'slack',
      threadRef: {},
      action: { stepId: 'svc', tk: 't1', namespace: 'wizard', value: 'api-gw' },
    });
  });

  it('returns null on malformed JSON payloads', () => {
    expect(mapSlackAction({ channel: 'C1', threadTs: '1.1', actionId: 'card_button_0', value: '{oops' })).toBeNull();
  });
});
