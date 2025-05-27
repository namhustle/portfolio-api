import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { LocalRegisterDto } from './dtos'
import { UserService } from '../users/user.service'
import * as bcrypt from 'bcrypt'
import { UserDocument } from '../users/schemas'
import { JwtService } from '@nestjs/jwt'
import { Cache } from 'cache-manager'
import { UserRole } from '../users/enums'
import { ConfigService } from '@nestjs/config'
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from '../../common/constants'
import { Request } from 'express'
import { SessionService } from '../sessions/session.service'
import { TokenPayload, TokenResponse } from './types'
import { v4 } from 'uuid'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async localRegister(payload: LocalRegisterDto) {
    const existingUser = await this.userService.exists({
      email: payload.email,
    })
    if (existingUser) throw new ConflictException('Email already exists')
    const { password, ...subPayload } = payload
    const user = await this.userService.create({
      hashedPassword: bcrypt.hashSync(password, 10),
      ...subPayload,
    })

    return user.toJSON() as UserDocument
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const payload: TokenPayload | null = this.jwtService.decode(token)
      if (!payload?.sessionId || !payload?.sub) {
        this.logger.error('Invalid token payload: missing sessionId or sub')
        return false
      }

      // check if session is active
      const isSessionActive = await this.cacheManager.get<boolean>(
        `active_session:${payload.sessionId}`,
      )
      if (!isSessionActive) {
        return false
      }

      // check if token is in whiteList
      const isTokenValid = await this.cacheManager.get<boolean>(
        `token_whitelist:${payload.jti}`,
      )
      if (!isTokenValid) {
        return false
      }

      // Check if token was issued before password change
      if (payload.iat) {
        const tokenIatAvailable = await this.cacheManager.get<number>(
          `token_iat_available:${payload.sub}`,
        )

        if (tokenIatAvailable && payload.iat < tokenIatAvailable) {
          this.logger.warn(
            `Token for user ${payload.sub} was issued before password change`,
          )
          return false
        }
      }

      return true
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to validate token: ${errorMessage}`)
      return false
    }
  }

  async login(req: Request): Promise<TokenResponse> {
    const userDoc = req.user as unknown as UserDocument
    if (!userDoc._id || !userDoc.roles) {
      throw new UnauthorizedException('Invalid user data')
    }

    const session = await this.sessionService.create(req)
    await this.cacheManager.set(
      `active_session:${session._id.toString()}`,
      true,
      REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
    )

    return this.generateTokens(
      userDoc._id.toString(),
      userDoc.roles || [],
      session._id.toString(),
    )
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userService.findOne(
      { _id: userId },
      { select: '+hashedPassword' },
    )

    if (!user?.hashedPassword) {
      throw new NotFoundException('User not found')
    }

    if (!bcrypt.compareSync(currentPassword, user.hashedPassword)) {
      throw new UnauthorizedException('Invalid credentials')
    }

    await this.userService.findOneAndUpdate(
      { _id: userId },
      { hashedPassword: bcrypt.hashSync(newPassword, 10) },
    )

    const now = Math.floor(Date.now() / 1000)
    await this.cacheManager.set(
      `token_iat_available:${userId}`,
      now,
      ACCESS_TOKEN_EXPIRES_IN_SECONDS * 1000,
    )
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload: TokenPayload | object = this.jwtService.verify(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      )
      const { sub, jti, sessionId } = payload as TokenPayload

      await this.revokeToken(jti)
      await this.cacheManager.del(`active_session:${sessionId}`)

      await Promise.all([
        this.cacheManager.set(
          `active_session:${sessionId}`,
          true,
          REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
        ),
        this.sessionService.findOneAndUpdateOne(
          { _id: sessionId },
          {
            expiresAt: new Date(
              new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000),
            ),
          },
        ),
      ])

      const user = await this.userService.findOne({ _id: sub })
      if (!user) throw new NotFoundException('User not found')
      return this.generateTokens(
        user._id.toString(),
        user.roles || [],
        sessionId,
      )
    } catch (error: unknown) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    const accessTokenPayload: TokenPayload =
      await this.jwtService.decode(accessToken)
    const refreshTokenPayload: TokenPayload =
      await this.jwtService.decode(refreshToken)

    await Promise.all([
      this.revokeToken(accessTokenPayload.jti),
      this.revokeToken(refreshTokenPayload.jti),
      this.revokeSession(accessTokenPayload.sessionId),
      this.sessionService.deleteOne({ _id: accessTokenPayload.sessionId }),
    ])
  }

  private async generateTokens(
    userId: string,
    roles: UserRole[],
    sessionId: string,
  ): Promise<TokenResponse> {
    try {
      const accessTokenJti = v4()
      const accessToken = this.jwtService.sign(
        {
          sub: userId,
          sessionId: sessionId,
          jti: accessTokenJti,
          roles: roles,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        },
      )
      await this.cacheManager.set(
        `token_whitelist:${accessTokenJti}`,
        true,
        ACCESS_TOKEN_EXPIRES_IN_SECONDS * 1000,
      )

      const refreshTokenJti = v4()
      const refreshToken = this.jwtService.sign(
        {
          sub: userId,
          sessionId: sessionId,
          jti: refreshTokenJti,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        },
      )
      await this.cacheManager.set(
        `token_whitelist:${refreshTokenJti}`,
        true,
        REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
      )

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to generate tokens: ${errorMessage}`)
      throw new UnauthorizedException(
        `Failed to generate tokens: ${errorMessage}`,
      )
    }
  }

  private async revokeToken(jti: string): Promise<void> {
    try {
      // Remove token from whiteList
      await this.cacheManager.del(`token_whitelist:${jti}`)
    } catch (error: unknown) {
      throw new Error('Failed to revoke token')
    }
  }

  private async revokeSession(sessionId: string): Promise<void> {
    try {
      // Remove session from active sessions
      await this.cacheManager.del(`active_session:${sessionId}`)
    } catch (error: unknown) {
      throw new Error('Failed to revoke session')
    }
  }
}
