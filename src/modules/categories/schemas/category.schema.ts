import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import * as paginate from 'mongoose-paginate-v2'

export type CategoryDocument = HydratedDocument<Category>

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: String, unique: true, required: true })
  name: string

  @Prop({ type: String, required: false })
  description?: string
}

export const CategorySchema = SchemaFactory.createForClass(Category)
CategorySchema.plugin(paginate)
