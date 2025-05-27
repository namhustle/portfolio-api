import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DbModule } from './modules/db/db.module'
import { UserModule } from './modules/users/user.module'
import { AuthModule } from './modules/auth/auth.module'
import { CacheModule } from '@nestjs/cache-manager'
import { JwtAuthGuard } from './modules/auth/guards'
import { createKeyv } from '@keyv/redis'
import { Keyv } from 'keyv'
import { CacheableMemory } from 'cacheable'
import { AwsS3Module } from './modules/aws-s3/aws-s3.module'
import { SessionModule } from './modules/sessions/session.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        stores: [
          new Keyv({
            store: new CacheableMemory({ ttl: 60 * 1000, lruSize: 5 * 1000 }),
          }),
          createKeyv(configService.get<string>('REDIS_URI')),
        ],
      }),
      inject: [ConfigService],
    }),
    DbModule,
    AwsS3Module,
    UserModule,
    AuthModule,
    SessionModule,
  ],
  controllers: [],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
