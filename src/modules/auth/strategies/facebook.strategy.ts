import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy } from 'passport-facebook'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../../users/user.service'

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID') || '',
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET') || '',
      callbackURL:
        configService.get<string>('FACEBOOK_CALLBACK_URL') ||
        'http://localhost:3000/auth/facebook/callback',
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile

      const email = emails && emails.length > 0 ? emails[0].value : undefined

      const fullName =
        profile.displayName ||
        (name
          ? `${name.givenName || ''} ${name.familyName || ''}`.trim()
          : 'Facebook User')

      const avatar = photos && photos.length > 0 ? photos[0].value : undefined

      let user = await this.userService.findOne({ facebookId: id })

      if (!user && email) {
        const existingUser = await this.userService.findOne({ email })

        if (existingUser) {
          user = await this.userService.findOneAndUpdate(
            { email },
            { facebookId: id, avatar: avatar || existingUser.avatar },
          )
        } else {
          user = await this.userService.create({
            fullName,
            email,
            facebookId: id,
            avatar,
          })
        }
      } else if (!user) {
        user = await this.userService.create({
          fullName,
          facebookId: id,
          avatar,
        })
      }

      if (!user) {
        done(new Error('User not found'), false)
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
