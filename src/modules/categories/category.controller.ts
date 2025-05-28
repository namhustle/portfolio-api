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
import { CategoryService } from './category.service'
import { CreateCategoryDto, QueryCategoryDto, UpdateCategoryDto } from './dtos'
import { UserRole } from '../users/enums'
import { Public, Roles } from '../auth/decorators'

@Controller('categories')
@ApiTags('Categories')
@ApiBearerAuth()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @Roles(UserRole.ADMIN)
  async createOne(@Body() payload: CreateCategoryDto) {
    return {
      message: 'Create category successfully',
      data: await this.categoryService.createOne(payload),
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get list of categories' })
  @Public()
  async paginate(@Query() query: QueryCategoryDto) {
    const pagination = await this.categoryService.paginate(query)

    return {
      message: 'List of categories found',
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

  @Get(':categoryId')
  @ApiOperation({ summary: 'Get category by categoryId' })
  @Public()
  async findOneById(@Param('categoryId') categoryId: string) {
    return {
      message: 'Category found',
      data: await this.categoryService.findOneById(categoryId),
    }
  }

  @Patch(':categoryId')
  @ApiOperation({ summary: 'Update a category' })
  @Roles(UserRole.ADMIN)
  async findOneAndUpdate(
    @Param('categoryId') categoryId: string,
    @Body() payload: UpdateCategoryDto,
  ) {
    return {
      message: 'Category updated',
      data: await this.categoryService.findOneAndUpdate(
        { _id: categoryId },
        payload,
        { new: true },
      ),
    }
  }

  @Delete(':categoryId')
  @ApiOperation({ summary: 'Delete a category' })
  @Roles(UserRole.ADMIN)
  async deleteOne(@Param('categoryId') categoryId: string) {
    return {
      message: 'Category deleted',
      data: await this.categoryService.deleteOne({ _id: categoryId }),
    }
  }
}
