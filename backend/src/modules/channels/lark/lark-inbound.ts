import { InboundMessage } from '../channel.types';

export type LarkMessageEvent = {
  sender: { sender_type: string };
  message: {
    message_id: string;
    root_id?: string;
    chat_id: string;
    message_type: string;
    content: string; // JSON string, e.g. {"text":"..."}
  };
};

export type LarkCardActionEvent = {
  action: { value?: Record<string, unknown>; input_value?: string; tag?: string };
  context: { open_message_id: string };
};

export type LarkInbound = InboundMessage & { replyTo: string };

export function mapLarkMessage(event: LarkMessageEvent): LarkInbound | null {
  if (event.sender.sender_type !== 'user') return null; // loop guard
  if (event.message.message_type !== 'text') return null;
  let text = '';
  try {
    text = String((JSON.parse(event.message.content) as { text?: string }).text ?? '');
  } catch {
    return null;
  }
  text = text.replace(/@_user_\d+\s*/g, '').trim();
  if (!text) return null;
  const m = event.message;
  // TODO: Task 3 populates threadRef with a real {replyTo} for reply routing.
  return { threadKey: m.root_id ?? m.message_id, channel: 'lark', threadRef: {}, text, replyTo: m.message_id };
}

export function mapLarkCardAction(event: LarkCardActionEvent): LarkInbound | null {
  const base = event.action.value;
  if (!base || typeof base.tk !== 'string') return null;
  const action =
    event.action.tag === 'input' ? { ...base, value: event.action.input_value ?? '' } : base;
  return { threadKey: base.tk, channel: 'lark', threadRef: {}, action, replyTo: event.context.open_message_id };
}
