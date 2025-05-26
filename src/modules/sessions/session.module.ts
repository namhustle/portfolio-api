import { Module } from '@nestjs/common'
import { SessionService } from './session.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Session, SessionSchema } from './schemas'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
