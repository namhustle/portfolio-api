import { Module } from '@nestjs/common'
import { SessionService } from './session.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Session, SessionSchema } from './schemas'
import { SessionController } from './session.controller'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
