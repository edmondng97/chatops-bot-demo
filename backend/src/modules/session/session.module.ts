import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionDoc, SessionSchema } from './session.schema';
import { SessionService } from './session.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: SessionDoc.name, schema: SessionSchema }])],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
