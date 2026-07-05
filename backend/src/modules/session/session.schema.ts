import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'sessions', timestamps: false })
export class SessionDoc {
  @Prop({ required: true, unique: true }) threadKey!: string;
  @Prop({ required: true }) channel!: string;
  @Prop({ type: Object, required: true }) threadRef!: Record<string, string>;
  @Prop({ required: true }) command!: string;
  @Prop({ required: true }) state!: string;
  @Prop({ required: true }) locale!: string;
  @Prop({ required: true }) stepIndex!: number;
  @Prop({ type: Object, default: {} }) collected!: Record<string, unknown>;
  @Prop({ required: true }) updatedAt!: number;
  @Prop() nagSentAt?: number;
}
export type SessionDocument = HydratedDocument<SessionDoc>;
export const SessionSchema = SchemaFactory.createForClass(SessionDoc);
SessionSchema.index({ state: 1, updatedAt: 1 }); // sweeper scan
