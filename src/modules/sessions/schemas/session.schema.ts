import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import * as paginate from 'mongoose-paginate-v2'

export type SessionDocument = HydratedDocument<Session>

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: String, required: true })
  user: string

  @Prop({ type: Object, required: false, default: {} })
  deviceInfo: {
    deviceId?: string
    deviceName?: string
    deviceModel?: string
    platform?: string
    browser?: string
    os?: string
    ip?: string
  }

  @Prop({ type: Date, required: false, select: false })
  expiresAt?: Date
}

export const SessionSchema = SchemaFactory.createForClass(Session)
SessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })
SessionSchema.plugin(paginate)
