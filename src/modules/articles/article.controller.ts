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
import { ArticleService } from './article.service'
import { CreateArticleDto, QueryArticleDto, UpdateArticleDto } from './dtos'
import { AuthUser, Roles } from '../auth/decorators'
import { UserRole } from '../users/enums'
import { AuthPayload } from '../auth/types'

@Controller('articles')
@ApiTags('Articles')
@ApiBearerAuth()
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @ApiOperation({ summary: 'Create an article' })
  @Roles(UserRole.ADMIN)
  async createOne(
    @AuthUser() authUser: AuthPayload,
    @Body() payload: CreateArticleDto,
  ) {
    return {
      message: 'Create article successfully',
      data: await this.articleService.createOne({
        author: authUser.sub,
        ...payload,
      }),
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get list of articles' })
  async paginate(@Query() query: QueryArticleDto) {
    return {
      message: 'List of articles found',
      data: await this.articleService.paginate(query),
    }
  }

  @Get(':articleId')
  @ApiOperation({ summary: 'Get article by articleId' })
  async findOneById(@Param('articleId') articleId: string) {
    return {
      message: 'Article found',
      data: await this.articleService.findOneById(articleId),
    }
  }

  @Patch(':articleId')
  @ApiOperation({ summary: 'Update an article' })
  @Roles(UserRole.ADMIN)
  async findOneAndUpdate(
    @Param('articleId') articleId: string,
    @Body() payload: UpdateArticleDto,
  ) {
    return {
      message: 'Article updated',
      data: await this.articleService.findOneAndUpdate(
        { _id: articleId },
        payload,
        { new: true },
      ),
    }
  }

  @Delete(':articleId')
  @ApiOperation({ summary: 'Delete an article' })
  @Roles(UserRole.ADMIN)
  async deleteOne(@Param('articleId') articleId: string) {
    return {
      message: 'Article deleted',
      data: await this.articleService.deleteOne({ _id: articleId }),
    }
  }
}
