import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { PaginationDto } from '../../../common/dtos'
import { ArticleStatus } from '../types'
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateArticleDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  slug: string

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({})
  @IsMongoId({ each: true })
  @IsOptional()
  category?: string[]

  @ApiPropertyOptional({})
  @IsMongoId({ each: true })
  @IsOptional()
  tags?: string[]

  @ApiPropertyOptional({ enum: ArticleStatus, example: ArticleStatus.DRAFT })
  @IsEnum(ArticleStatus, {
    message: `Status must be one of: ${Object.values(ArticleStatus).join(', ')}`,
  })
  @IsOptional()
  status?: ArticleStatus

  @ApiPropertyOptional({ type: String })
  @IsDateString()
  @IsOptional()
  publishedAt?: Date
}

export class UpdateArticleDto extends PartialType(CreateArticleDto) {}

export class QueryArticleDto extends PaginationDto {}
