import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Category, CategoryDocument } from './schemas'
import {
  FilterQuery,
  PaginateModel,
  PaginateOptions,
  QueryOptions,
} from 'mongoose'
import { QueryCategoryDto } from './dtos'

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: PaginateModel<CategoryDocument>,
  ) {}

  async createOne(payload: Omit<Category, '_id'>) {
    return this.categoryModel.create(payload)
  }

  async paginate(query: QueryCategoryDto) {
    const filter: FilterQuery<Category> = {}
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ]
    }

    const options: PaginateOptions = {
      page: query.page,
      limit: query.limit,
      sort: query.getSortObject(),
    }

    return this.categoryModel.paginate(filter, options)
  }

  async findOneById(categoryId: string) {
    return this.categoryModel.findById(categoryId)
  }

  async findOneAndUpdate(
    filter: FilterQuery<Category>,
    payload: Partial<Category>,
    options?: QueryOptions,
  ) {
    return this.categoryModel.findOneAndUpdate(filter, payload, options)
  }

  async deleteOne(filter: FilterQuery<Category>) {
    return this.categoryModel.deleteOne(filter)
  }
}
