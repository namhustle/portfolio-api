import { UserRole } from '../../users/enums'

export type TokenResponse = {
  access_token: string
  refresh_token: string
}

export type TokenPayload = {
  sub: string
  roles: UserRole[]
  sessionId: string
  jti: string
  iat: number
  exp: number
}
