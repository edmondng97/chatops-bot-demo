import { toSlackMessage } from './block-kit-renderer';
import { CardSpec } from '../channel.types';

const card: CardSpec = {
  header: { title: 'Diagnose', color: 'blue' },
  blocks: [
    { type: 'note', text: 'step 1/3' },
    { type: 'text', text: 'Pick an environment' },
    {
      type: 'buttons',
      actions: [
        { text: 'prod', value: { stepId: 'env', tk: 't1', namespace: 'wizard', value: 'prod' } },
        { text: 'staging', value: { stepId: 'env', tk: 't1', namespace: 'wizard', value: 'staging' } },
      ],
    },
    { type: 'input', placeholder: 'service name', submit: 'Submit', value: { stepId: 'svc', tk: 't1', namespace: 'wizard' } },
  ],
};

describe('toSlackMessage', () => {
  it('renders text reply as plain text', () => {
    expect(toSlackMessage({ kind: 'text', text: 'hi' })).toEqual({ text: 'hi' });
  });

  it('wraps card blocks in a colored attachment with header', () => {
    const msg = toSlackMessage({ kind: 'card', card });
    expect(msg.text).toBe('Diagnose');
    const att = (msg.attachments as any[])[0];
    expect(att.color).toBe('#4A90D9'); // blue → hex
    expect(att.blocks[0]).toEqual({ type: 'header', text: { type: 'plain_text', text: 'Diagnose', emoji: true } });
  });

  it('maps note/text to context/section and buttons to actions block', () => {
    const att = (toSlackMessage({ kind: 'card', card }).attachments as any[])[0];
    expect(att.blocks[1]).toEqual({ type: 'context', elements: [{ type: 'mrkdwn', text: 'step 1/3' }] });
    expect(att.blocks[2]).toEqual({ type: 'section', text: { type: 'mrkdwn', text: 'Pick an environment' } });
    const actions = att.blocks[3];
    expect(actions.type).toBe('actions');
    expect(actions.elements[0].type).toBe('button');
    expect(actions.elements[0].action_id).toBe('card_button_0');
    expect(JSON.parse(actions.elements[0].value)).toEqual({ stepId: 'env', tk: 't1', namespace: 'wizard', value: 'prod' });
  });

  it('maps input to a dispatch_action input block carrying value in block_id', () => {
    const att = (toSlackMessage({ kind: 'card', card }).attachments as any[])[0];
    const input = att.blocks[4];
    expect(input.type).toBe('input');
    expect(input.dispatch_action).toBe(true);
    expect(JSON.parse(input.block_id)).toEqual({ stepId: 'svc', tk: 't1', namespace: 'wizard' });
    expect(input.element).toMatchObject({ type: 'plain_text_input', action_id: 'card_input' });
    expect(input.label.text).toBe('service name');
  });

  it('falls back to default color for unknown color names', () => {
    const c: CardSpec = { header: { title: 'X', color: 'weird' }, blocks: [] };
    const att = (toSlackMessage({ kind: 'card', card: c }).attachments as any[])[0];
    expect(att.color).toBe('#616061');
  });
});
