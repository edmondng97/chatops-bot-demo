// Channel adapter boundary: every adapter maps platform events into
// InboundMessage, feeds the orchestrator, and renders OutboundReply back
// into the platform's native message format.
export { InboundMessage, OutboundReply } from '../flow/flow-orchestrator.service';
export { CardSpec, CardBlock, CardAction } from '../flow/card.types';
