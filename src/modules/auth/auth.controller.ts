import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
  // Version,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import {
  ChangePasswordDto,
  LocalLoginDto,
  LocalRegisterDto,
  RefreshTokenDto,
} from './dtos'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthUser, Public } from './decorators'
import { FacebookAuthGuard, GoogleAuthGuard, LocalAuthGuard } from './guards'
import { Request } from 'express'
import { AuthPayload } from './types'
//import { ApiVersioned } from '../../common/decorators'

@Controller('auth')
@ApiTags('Auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Version('1')
  // @ApiVersioned('1')
  @Post('local/register')
  @Public()
  @ApiOperation({ summary: 'Register a local user' })
  async localRegister(@Body() payload: LocalRegisterDto) {
    return {
      message: 'Register successfully',
      data: await this.authService.localRegister(payload),
    }
  }

  @Post('local/login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login a local user' })
  async localLogin(@Body() payload: LocalLoginDto, @Req() req: Request) {
    return {
      message: 'Login successfully',
      data: await this.authService.login(req.user),
    }
  }

  @Post('refresh-token')
  @Public()
  @ApiOperation({ summary: 'Refresh a token' })
  async refreshToken(@Body() payload: RefreshTokenDto) {
    return {
      message: 'Refresh token successfully',
      data: await this.authService.refreshToken(payload.refreshToken),
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout a user' })
  async logout(@Body() payload: RefreshTokenDto, @Req() req: Request) {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization
    const accessToken: string | undefined = authHeader?.split(' ')[1]
    if (!accessToken) {
      throw new NotFoundException('No access token found in request')
    }

    // Logout with both refresh token and access token
    await this.authService.logout(payload.refreshToken, accessToken)

    return {
      message: 'Logout successfully',
    }
  }

  @Post('/change-password')
  @ApiOperation({ summary: 'Change Password' })
  async changePassword(
    @AuthUser() authUser: AuthPayload,
    @Body() payload: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      authUser.sub,
      payload.currentPassword,
      payload.newPassword,
    )

    return {
      message: 'Change password successfully',
    }
  }

  @Get('/google')
  @Public()
  @ApiOperation({ summary: 'Google OAuth Login' })
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('/google/callback')
  @Public()
  @ApiOperation({ summary: 'Google OAuth Callback' })
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request) {
    return {
      message: 'Google login successfully',
      data: await this.authService.login(req.user),
    }
  }

  @Get('/facebook')
  @Public()
  @ApiOperation({ summary: 'Facebook OAuth Login' })
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {}

  @Get('/facebook/callback')
  @Public()
  @ApiOperation({ summary: 'Facebook OAuth Callback' })
  @UseGuards(FacebookAuthGuard)
  async facebookAuthCallback(@Req() req: Request) {
    return {
      message: 'Facebook login successfully',
      data: await this.authService.login(req.user),
    }
  }
}
