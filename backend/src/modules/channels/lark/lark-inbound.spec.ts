import { mapLarkCardAction, mapLarkMessage } from './lark-inbound';

describe('mapLarkMessage', () => {
  const base = { sender: { sender_type: 'user' } };

  it('maps a text message; threadKey = message_id when no root', () => {
    expect(
      mapLarkMessage({
        ...base,
        message: { message_id: 'm1', chat_id: 'c1', message_type: 'text', content: '{"text":"diagnose"}' },
      }),
    ).toEqual({ threadKey: 'm1', text: 'diagnose', replyTo: 'm1' });
  });

  it('uses root_id for threaded replies', () => {
    expect(
      mapLarkMessage({
        ...base,
        message: { message_id: 'm2', root_id: 'm1', chat_id: 'c1', message_type: 'text', content: '{"text":"hi"}' },
      }),
    ).toEqual({ threadKey: 'm1', text: 'hi', replyTo: 'm2' });
  });

  it('strips @mention placeholders from text', () => {
    expect(
      mapLarkMessage({
        ...base,
        message: { message_id: 'm1', chat_id: 'c1', message_type: 'text', content: '{"text":"@_user_1 diagnose"}' },
      })!.text,
    ).toBe('diagnose');
  });

  it('ignores app senders and non-text messages (loop guard)', () => {
    expect(
      mapLarkMessage({
        sender: { sender_type: 'app' },
        message: { message_id: 'm1', chat_id: 'c1', message_type: 'text', content: '{"text":"x"}' },
      }),
    ).toBeNull();
    expect(
      mapLarkMessage({
        ...base,
        message: { message_id: 'm1', chat_id: 'c1', message_type: 'image', content: '{}' },
      }),
    ).toBeNull();
  });
});

describe('mapLarkCardAction', () => {
  it('maps button value; threadKey from value.tk', () => {
    expect(
      mapLarkCardAction({
        action: { value: { stepId: 'env', tk: 'm1', namespace: 'wizard', value: 'prod' } },
        context: { open_message_id: 'm9' },
      }),
    ).toEqual({
      threadKey: 'm1',
      action: { stepId: 'env', tk: 'm1', namespace: 'wizard', value: 'prod' },
      replyTo: 'm9',
    });
  });

  it('merges input_value into base value for input elements', () => {
    expect(
      mapLarkCardAction({
        action: { tag: 'input', input_value: 'api-gw', value: { stepId: 'svc', tk: 'm1', namespace: 'wizard' } },
        context: { open_message_id: 'm9' },
      }),
    ).toEqual({
      threadKey: 'm1',
      action: { stepId: 'svc', tk: 'm1', namespace: 'wizard', value: 'api-gw' },
      replyTo: 'm9',
    });
  });

  it('returns null when value or tk missing', () => {
    expect(mapLarkCardAction({ action: {}, context: { open_message_id: 'm9' } })).toBeNull();
  });
});
