import { Global, Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { UserModule } from '../users/user.module'
import {
  FacebookStrategy,
  GoogleStrategy,
  JwtStrategy,
  LocalStrategy,
} from './strategies'
import { ACCESS_TOKEN_EXPIRES_IN } from '../../common/constants'
import { SessionModule } from '../sessions/session.module'

@Global()
@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory(config: ConfigService) {
        return {
          secret: config.get<string>('JWT_ACCESS_SECRET'),
          signOptions: {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
          },
        }
      },
      inject: [ConfigService],
    }),
    SessionModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
  ],
})
export class AuthModule {}
