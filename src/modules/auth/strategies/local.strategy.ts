import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { UserService } from '../../users/user.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private userService: UserService) {
    super({ usernameField: 'email' })
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.userService.findOne(
      { email },
      { select: '+hashedPassword' },
    )
    if (
      user &&
      user.hashedPassword &&
      bcrypt.compareSync(password, user.hashedPassword)
    ) {
      const { hashedPassword, ...safeUser } = user.toJSON()

      return safeUser
    }

    throw new UnauthorizedException('Invalid credentials')
  }
}
