import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import * as paginate from 'mongoose-paginate-v2'
import { ArticleStatus, ImageType } from '../types'

export type ArticleDocument = HydratedDocument<Article>

@Schema({ timestamps: true })
export class Article {
  @Prop({ type: String, ref: 'User', required: true })
  author: string

  @Prop({ type: String, required: true })
  title: string

  @Prop({ type: String, required: true, unique: true })
  slug: string

  @Prop({ type: String, required: true })
  content: string

  @Prop({ type: String, required: false })
  description?: string

  @Prop({ type: [String], required: false })
  category?: string[]

  @Prop({ type: [String], required: false })
  tags?: string[]

  @Prop({ type: Object, required: false })
  featuredImage?: ImageType

  @Prop({ type: [Object], required: false, default: [] })
  images?: ImageType[]

  @Prop({
    type: String,
    enum: ArticleStatus,
    required: false,
    default: ArticleStatus.DRAFT,
  })
  status?: ArticleStatus

  @Prop({ type: Date, required: false })
  publishedAt?: Date
}

export const ArticleSchema = SchemaFactory.createForClass(Article)
ArticleSchema.plugin(paginate)
