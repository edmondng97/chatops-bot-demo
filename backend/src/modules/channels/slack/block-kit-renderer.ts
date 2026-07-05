import { CardBlock, CardSpec, OutboundReply } from '../channel.types';

// Slack has no card header color — approximate with attachment color bar.
const COLOR_MAP: Record<string, string> = {
  blue: '#4A90D9',
  green: '#2EB67D',
  red: '#E01E5A',
  orange: '#ECB22E',
  grey: '#616061',
  turquoise: '#2EB6BE',
};
const DEFAULT_COLOR = '#616061';

// Guards future CardBlock extensions at compile time.
function assertNever(x: never): never {
  throw new Error(`Unhandled CardBlock type: ${JSON.stringify(x)}`);
}

function renderBlock(block: CardBlock): unknown {
  switch (block.type) {
    case 'note':
      return { type: 'context', elements: [{ type: 'mrkdwn', text: block.text }] };
    case 'text':
      return { type: 'section', text: { type: 'mrkdwn', text: block.text } };
    case 'buttons':
      return {
        type: 'actions',
        elements: block.actions.map((a, i) => ({
          type: 'button',
          action_id: `card_button_${i}`,
          text: { type: 'plain_text', text: a.text, emoji: true },
          value: JSON.stringify(a.value),
        })),
      };
    case 'input':
      // Base value travels in block_id; the typed text arrives as action.value.
      return {
        type: 'input',
        dispatch_action: true,
        block_id: JSON.stringify(block.value),
        label: { type: 'plain_text', text: block.placeholder, emoji: true },
        element: {
          type: 'plain_text_input',
          action_id: 'card_input',
          placeholder: { type: 'plain_text', text: block.placeholder },
        },
      };
    default:
      return assertNever(block);
  }
}

export function toSlackMessage(reply: OutboundReply): {
  text: string;
  blocks?: unknown[];
  attachments?: unknown[];
} {
  if (reply.kind === 'text') return { text: reply.text };
  const { card } = reply;
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: card.header.title, emoji: true } },
    ...card.blocks.map(renderBlock),
  ];
  return {
    text: card.header.title, // notification fallback
    attachments: [{ color: COLOR_MAP[card.header.color] ?? DEFAULT_COLOR, blocks }],
  };
}
