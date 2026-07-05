import { CardBlock, CardSpec, OutboundReply } from '../channel.types';

// Lark card header templates are named colors, not hex.
const KNOWN_TEMPLATES = new Set(['blue', 'wathet', 'turquoise', 'green', 'yellow', 'orange', 'red', 'carmine', 'violet', 'purple', 'indigo', 'grey']);

function renderElement(block: CardBlock): unknown {
  switch (block.type) {
    case 'note':
      return { tag: 'note', elements: [{ tag: 'plain_text', content: block.text }] };
    case 'text':
      return { tag: 'div', text: { tag: 'lark_md', content: block.text } };
    case 'buttons':
      return {
        tag: 'action',
        actions: block.actions.map((a) => ({
          tag: 'button',
          text: { tag: 'plain_text', content: a.text },
          type: 'primary',
          value: a.value,
        })),
      };
    case 'input':
      return {
        tag: 'action',
        actions: [
          {
            tag: 'input',
            name: 'card_input',
            placeholder: { tag: 'plain_text', content: block.placeholder },
            value: block.value,
          },
        ],
      };
  }
}

export function toLarkMessage(reply: OutboundReply): { msgType: 'text' | 'interactive'; content: string } {
  if (reply.kind === 'text') return { msgType: 'text', content: JSON.stringify({ text: reply.text }) };
  const { card } = reply;
  return {
    msgType: 'interactive',
    content: JSON.stringify({
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: card.header.title },
        template: KNOWN_TEMPLATES.has(card.header.color) ? card.header.color : 'grey',
      },
      elements: card.blocks.map(renderElement),
    }),
  };
}
