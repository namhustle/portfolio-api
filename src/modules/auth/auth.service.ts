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
import { TokenPayload, TokenResponse } from './interfaces/token.interface'
import { UserRole } from '../users/enums'
import { ConfigService } from '@nestjs/config'
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN,
} from '../../common/constants'
import { Request } from 'express'
import { SessionService } from '../sessions/session.service'

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

      // Check if token is blacklisted
      if (await this.cacheManager.get(`token_blacklist:${payload.sessionId}`)) {
        this.logger.warn(
          `Token with sessionId ${payload.sessionId} is blacklisted`,
        )
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
    if (!userDoc._id || !userDoc.fullName || !userDoc.roles) {
      throw new UnauthorizedException('Invalid user data')
    }

    const session = await this.sessionService.create(req)

    return this.generateTokens(
      userDoc._id.toString(),
      userDoc.fullName,
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
      const { sub, sessionId, exp } = payload as TokenPayload
      const user = await this.userService.findOne({ _id: sub })
      if (!user) throw new NotFoundException('User not found')

      await this.revokeToken(sessionId, exp)

      return this.generateTokens(
        user._id.toString(),
        user.fullName,
        user.roles || [],
        sessionId,
      )
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to validate token: ${errorMessage}`)
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    const accessTokenPayload: TokenPayload =
      await this.jwtService.decode(accessToken)
    const refreshTokenPayload: TokenPayload =
      await this.jwtService.decode(refreshToken)

    await Promise.all([
      this.revokeToken(accessTokenPayload.sessionId, accessTokenPayload.exp),
      this.revokeToken(refreshTokenPayload.sessionId, refreshTokenPayload.exp),
      this.sessionService.deleteOne({ _id: accessTokenPayload.sessionId }),
    ])
  }

  private async generateTokens(
    userId: string,
    fullName: string,
    roles: UserRole[],
    sessionId: string,
  ): Promise<TokenResponse> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.sign(
          {
            sub: userId,
            sessionId: sessionId,
            fullName: fullName,
            roles: roles,
          },
          {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          },
        ),
        this.jwtService.sign(
          {
            sub: userId,
            sessionId: sessionId,
          },
          {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: REFRESH_TOKEN_EXPIRES_IN,
          },
        ),
      ])

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

  private async revokeToken(sessionId: string, exp: number): Promise<void> {
    try {
      // Calculate TTL based on token expiration
      const now = Math.floor(Date.now() / 1000)
      const ttl = Math.max(exp - now, 0) * 1000

      // Add token to blacklist
      await this.cacheManager.set(`token_blacklist:${sessionId}`, true, ttl)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to validate token: ${errorMessage}`)
      throw new Error('Failed to revoke token')
    }
  }
}
