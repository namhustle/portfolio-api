import { PaginationDto } from '../../../common/dtos'
import { IsMongoId, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class QuerySessionDto extends PaginationDto {
  @ApiPropertyOptional({ type: String })
  @IsMongoId()
  @IsOptional()
  user?: string
}
