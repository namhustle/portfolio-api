import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Tag, TagDocument } from './schemas'
import {
  FilterQuery,
  PaginateModel,
  PaginateOptions,
  QueryOptions,
} from 'mongoose'
import { QueryTagDto } from './dtos'

@Injectable()
export class TagService {
  constructor(
    @InjectModel(Tag.name) private tagModel: PaginateModel<TagDocument>,
  ) {}

  async createOne(payload: Omit<Tag, '_id'>) {
    return this.tagModel.create(payload)
  }

  async paginate(query: QueryTagDto) {
    const filter: FilterQuery<Tag> = {}
    if (query.search) {
      filter.$or = [{ name: { $regex: query.search, $options: 'i' } }]
    }

    const options: PaginateOptions = {
      page: query.page,
      limit: query.limit,
      sort: query.getSortObject(),
    }

    return this.tagModel.paginate(filter, options)
  }

  async findOneById(tagId: string) {
    return this.tagModel.findById(tagId)
  }

  async findOneAndUpdate(
    filter: FilterQuery<Tag>,
    payload: Partial<Omit<Tag, '_id'>>,
    options?: QueryOptions,
  ) {
    return this.tagModel.findOneAndUpdate(filter, payload, options)
  }

  async deleteOne(filter: FilterQuery<Tag>) {
    return this.tagModel.deleteOne(filter)
  }
}
