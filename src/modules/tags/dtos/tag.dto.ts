import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'
import { PaginationDto } from '../../../common/dtos'

export class CreateTagDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string
}

export class UpdateTagDto extends PartialType(CreateTagDto) {}

export class QueryTagDto extends PaginationDto {}
