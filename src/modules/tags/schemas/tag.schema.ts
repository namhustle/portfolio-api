import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import * as paginate from 'mongoose-paginate-v2'

export type TagDocument = HydratedDocument<Tag>

@Schema({ timestamps: true })
export class Tag {
  @Prop({ type: String, unique: true, required: true })
  name: string
}

export const TagSchema = SchemaFactory.createForClass(Tag)
TagSchema.plugin(paginate)
