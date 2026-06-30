import { Body, Controller, Post } from '@nestjs/common';
import { FlowOrchestratorService, InboundMessage, OutboundReply } from '../flow/flow-orchestrator.service';

/**
 * Desensitized message entry. In production an IM WebSocket gateway feeds messages here;
 * this HTTP endpoint stands in for "received one IM message" so the demo runs with no
 * external services. threadKey = root_id ?? message_id in the real system.
 */
@Controller()
export class GatewayController {
  constructor(private readonly orchestrator: FlowOrchestratorService) {}

  @Post('message')
  message(@Body() body: InboundMessage): Promise<OutboundReply> {
    return this.orchestrator.handle(body);
  }
}
