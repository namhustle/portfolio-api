import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User, UserDocument } from './schemas'
import { FilterQuery, PaginateModel, PaginateOptions } from 'mongoose'
import { QueryUserDto } from './dtos'
import { UserRole } from './enums'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: PaginateModel<UserDocument>,
  ) {}

  async create(payload: Omit<User, '_id'>) {
    const userCount = await this.userModel.countDocuments({})
    if (userCount === 0) {
      payload.roles = [UserRole.ADMIN]
    }

    return this.userModel.create(payload)
  }

  async paginate(query: QueryUserDto) {
    const filter: FilterQuery<User> = {}
    if (query.gender) filter.gender = query.gender
    if (query.roles) filter.roles = { $in: query.roles }
    if (query.search) {
      filter.$or = [
        { fullName: { $regex: query.search, $options: 'i' } },
        { username: { $regex: query.search, $options: 'i' } },
      ]
    }

    const options: PaginateOptions = {
      page: query.page,
      limit: query.limit,
      sort: query.getSortObject(),
    }

    return this.userModel.paginate(filter, options)
  }

  async findOneById(userId: string) {
    return this.userModel.findById(userId)
  }

  async findOne(
    filter: FilterQuery<User>,
    options: {
      select?: string | string[]
    } = {},
  ) {
    return this.userModel.findOne(filter).select(options.select || {})
  }

  async exists(filter: FilterQuery<User>) {
    return this.userModel.exists(filter)
  }

  async findOneAndUpdate(
    filter: FilterQuery<User>,
    payload: Partial<Omit<User, '_id'>>,
  ) {
    if (payload.username) {
      const existing = await this.exists({ username: payload.username })
      if (existing) throw new Error('Username already exists')
    }

    if (payload.email) {
      const existing = await this.exists({ email: payload.email })
      if (existing) throw new Error('Email already exists')
    }

    return this.userModel.findOneAndUpdate(filter, payload, {
      new: true,
    })
  }

  async deleteOne(filter: FilterQuery<User>) {
    return this.userModel.deleteOne(filter)
  }
}
