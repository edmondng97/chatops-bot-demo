import { toLarkMessage } from './lark-card-renderer';
import { CardSpec } from '../channel.types';

const card: CardSpec = {
  header: { title: 'Diagnose', color: 'blue' },
  blocks: [
    { type: 'note', text: 'step 1/3' },
    { type: 'text', text: 'Pick an environment' },
    { type: 'buttons', actions: [{ text: 'prod', value: { stepId: 'env', tk: 't1', namespace: 'wizard', value: 'prod' } }] },
    { type: 'input', placeholder: 'service name', submit: 'Submit', value: { stepId: 'svc', tk: 't1', namespace: 'wizard' } },
  ],
};

describe('toLarkMessage', () => {
  it('renders text reply as Lark text content', () => {
    expect(toLarkMessage({ kind: 'text', text: 'hi' })).toEqual({
      msgType: 'text',
      content: JSON.stringify({ text: 'hi' }),
    });
  });

  it('renders card header with template color', () => {
    const { msgType, content } = toLarkMessage({ kind: 'card', card });
    expect(msgType).toBe('interactive');
    const c = JSON.parse(content);
    expect(c.header).toEqual({ title: { tag: 'plain_text', content: 'Diagnose' }, template: 'blue' });
  });

  it('maps note/text/buttons/input elements', () => {
    const c = JSON.parse(toLarkMessage({ kind: 'card', card }).content);
    expect(c.elements[0]).toEqual({ tag: 'note', elements: [{ tag: 'plain_text', content: 'step 1/3' }] });
    expect(c.elements[1]).toEqual({ tag: 'div', text: { tag: 'lark_md', content: 'Pick an environment' } });
    expect(c.elements[2].tag).toBe('action');
    expect(c.elements[2].actions[0]).toEqual({
      tag: 'button',
      text: { tag: 'plain_text', content: 'prod' },
      type: 'primary',
      value: { stepId: 'env', tk: 't1', namespace: 'wizard', value: 'prod' },
    });
    expect(c.elements[3]).toEqual({
      tag: 'action',
      actions: [
        {
          tag: 'input',
          name: 'card_input',
          placeholder: { tag: 'plain_text', content: 'service name' },
          value: { stepId: 'svc', tk: 't1', namespace: 'wizard' },
        },
      ],
    });
  });

  it('falls back to grey template for unknown colors', () => {
    const c: CardSpec = { header: { title: 'X', color: 'weird' }, blocks: [] };
    expect(JSON.parse(toLarkMessage({ kind: 'card', card: c }).content).header.template).toBe('grey');
  });
});
