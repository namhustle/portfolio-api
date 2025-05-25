import { Injectable, NotFoundException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../../users/user.service'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile
    const email = emails[0].value
    const fullName = name.givenName + ' ' + name.familyName
    const googleId = profile.id
    const avatar = photos[0].value

    try {
      let user = await this.userService.findOne({ googleId })

      if (!user) {
        const existingUser = await this.userService.findOne({ email })

        if (existingUser) {
          user = await this.userService.findOneAndUpdate(
            { email },
            { googleId, avatar: avatar || existingUser.avatar },
          )
        } else {
          user = await this.userService.create({
            fullName,
            email,
            googleId,
            avatar,
          })
        }
      }

      if (!user) {
        done(new NotFoundException('User not found'), false)
        return
      }

      const userObject = user.toJSON()
      const { hashedPassword, ...result } = userObject

      done(null, result)
    } catch (error) {
      done(error, false)
    }
  }
}
