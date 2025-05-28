import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TagService } from './tag.service'
import { Roles } from '../auth/decorators'
import { UserRole } from '../users/enums'
import { CreateTagDto, QueryTagDto, UpdateTagDto } from './dtos'

@Controller('tags')
@ApiTags('Tags')
@ApiBearerAuth()
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a tag' })
  @Roles(UserRole.ADMIN)
  async createOne(@Body() payload: CreateTagDto) {
    return {
      message: 'Create tag successfully',
      data: await this.tagService.createOne(payload),
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get list of tags' })
  async paginate(@Query() query: QueryTagDto) {
    const pagination = await this.tagService.paginate(query)

    return {
      message: 'List of tags found',
      data: pagination.docs,
      pagination: {
        totalItems: pagination.totalDocs,
        totalPages: pagination.totalPages,
        currentPage: pagination.page,
        itemsPerPage: pagination.limit,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    }
  }

  @Get(':tagId')
  @ApiOperation({ summary: 'Get tag by tagId' })
  async findOneById(@Param('tagId') tagId: string) {
    return {
      message: 'Tag found',
      data: await this.tagService.findOneById(tagId),
    }
  }

  @Patch(':tagId')
  @ApiOperation({ summary: 'Update a tag' })
  @Roles(UserRole.ADMIN)
  async findOneAndUpdate(
    @Param('tagId') tagId: string,
    @Body() payload: UpdateTagDto,
  ) {
    return {
      message: 'Tag updated',
      data: await this.tagService.findOneAndUpdate({ _id: tagId }, payload, {
        new: true,
      }),
    }
  }

  @Delete(':tagId')
  @ApiOperation({ summary: 'Delete a tag' })
  @Roles(UserRole.ADMIN)
  async deleteOne(@Param('tagId') tagId: string) {
    return {
      message: 'Tag deleted',
      data: await this.tagService.deleteOne({ _id: tagId }),
    }
  }
}
