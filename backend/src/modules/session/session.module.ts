import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionDoc, SessionSchema } from './session.schema';
import { SessionService } from './session.service';
import { SessionSweeperService } from './session-sweeper.service';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: SessionDoc.name, schema: SessionSchema }]), ChannelsModule],
  providers: [SessionService, SessionSweeperService],
  exports: [SessionService],
})
export class SessionModule {}
