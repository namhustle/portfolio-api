import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Article, ArticleDocument } from './schemas/article.schema'
import {
  FilterQuery,
  PaginateModel,
  PaginateOptions,
  QueryOptions,
} from 'mongoose'
import { QueryArticleDto } from './dtos'

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name)
    private articleModel: PaginateModel<ArticleDocument>,
  ) {}

  async createOne(payload: Omit<Article, '_id'>) {
    return this.articleModel.create(payload)
  }

  async paginate(query: QueryArticleDto) {
    const filter: FilterQuery<Article> = {}

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { slug: { $regex: query.search, $options: 'i' } },
        { content: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ]
    }

    const options: PaginateOptions = {
      page: query.page,
      limit: query.limit,
      sort: query.getSortObject(),
    }

    return this.articleModel.paginate(filter, options)
  }

  async findOneById(articleId: string) {
    return this.articleModel.findById(articleId)
  }

  async findOneAndUpdate(
    filter: FilterQuery<Article>,
    payload: Partial<Omit<Article, '_id'>>,
    options?: QueryOptions,
  ) {
    return this.articleModel.findOneAndUpdate(filter, payload, options)
  }

  async deleteOne(filter: FilterQuery<Article>) {
    return this.articleModel.deleteOne(filter)
  }
}
