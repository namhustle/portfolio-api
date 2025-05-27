import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { UserService } from './user.service'
import { QueryUserDto, UpdateProfileDto, UpdateUserDto } from './dtos'
import { AuthUser, Roles } from '../auth/decorators'
import { UserRole } from './enums'
import { AuthPayload } from '../auth/types'
import { FileInterceptor } from '@nestjs/platform-express'
import { AwsS3Service } from '../aws-s3/aws-s3.service'
import * as path from 'node:path'

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get list of users' })
  async paginateUsers(@Query() query: QueryUserDto) {
    const pagination = await this.userService.paginate(query)
    
    return {
      message: 'List of users found',
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

  @Get('me')
  @ApiOperation({ summary: 'Get me' })
  async getProfile(@AuthUser() authUser: AuthPayload) {
    return {
      message: 'Profile found',
      data: await this.userService.findOneById(authUser.sub),
    }
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update me' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        username: { type: 'string' },
        gender: { type: 'string' },
        removeAvatar: { type: 'boolean' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        if (
          !file.mimetype.startsWith('image/') ||
          file.mimetype === 'image/gif'
        ) {
          return callback(
            new BadRequestException('Only images accepted'),
            false,
          )
        }
        callback(null, true)
      },
    }),
  )
  async updateProfile(
    @AuthUser() authUser: AuthPayload,
    @Body() payload: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let avatar: string | undefined
    if (file) {
      const fileExtension = path.extname(file.originalname)
      avatar = await this.awsS3Service.uploadPublicFile(
        `users/avatar/${authUser.sub}${fileExtension}`,
        file,
      )
    }

    if (payload.removeAvatar) {
      const user = await this.userService.findOneById(authUser.sub)
      if (user?.avatar) {
        await this.awsS3Service.deleteFile(
          this.awsS3Service.extractKeyFromUrl(user.avatar),
        )
        payload['avatar'] = null
      }
    }

    return {
      message: 'Profile updated',
      data: await this.userService.findOneAndUpdate(
        { _id: authUser.sub },
        {
          avatar,
          ...payload,
        },
      ),
    }
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user by userId' })
  async findUserById(@Param('userId') userId: string) {
    return {
      message: 'User found',
      data: await this.userService.findOneById(userId),
    }
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update a user' })
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param('userId') userId: string,
    @Body() payload: UpdateUserDto,
  ) {
    return {
      message: 'User updated',
      data: await this.userService.findOneAndUpdate({ _id: userId }, payload),
    }
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete a user' })
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('userId') userId: string) {
    return {
      message: 'User deleted',
      data: await this.userService.deleteOne({ _id: userId }),
    }
  }
}
