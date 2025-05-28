import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { PaginationDto } from '../../../common/dtos'

export class CreateCategoryDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  description?: string
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class QueryCategoryDto extends PaginationDto {}
