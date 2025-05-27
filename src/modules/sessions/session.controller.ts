import { SessionService } from './session.service'
import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { QuerySessionDto } from './dtos'
import { AuthUser } from '../auth/decorators'
import { AuthPayload } from '../auth/types'

@Controller('sessions')
@ApiTags('Sessions')
@ApiBearerAuth()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get list of sessions for current user' })
  async paginate(
    @AuthUser() authUser: AuthPayload,
    @Query() query: QuerySessionDto,
  ) {
    query.user = authUser.sub
    const pagination = await this.sessionService.paginate(query)

    return {
      message: 'List of sessions found',
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

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get session by sessionId' })
  async findById(
    @AuthUser() authUser: AuthPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return {
      message: 'Session found',
      data: await this.sessionService.findOne({
        _id: sessionId,
        user: authUser.sub,
      }),
    }
  }
}
