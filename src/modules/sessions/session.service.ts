import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Session, SessionDocument } from './schemas'
import { FilterQuery, PaginateModel } from 'mongoose'
import { DeviceInfo } from './types'
import { UAParser } from 'ua-parser-js'
import { Request } from 'express'
import { UserDocument } from '../users/schemas'
import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from '../../common/constants'

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: PaginateModel<SessionDocument>,
  ) {}

  extractDeviceInfo(req: Request): DeviceInfo {
    const userAgent = req.headers['user-agent'] || ''
    const ip =
      req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    const parser = new UAParser(userAgent)
    const browser = parser.getBrowser()
    const os = parser.getOS()
    const device = parser.getDevice()

    return {
      deviceName: device.vendor
        ? `${device.vendor} ${device.model}`
        : browser.name,
      deviceModel: device.model || '',
      platform:
        device.type ||
        (os.name === 'Android' || os.name === 'iOS' ? 'mobile' : 'desktop'),
      browser: browser.name || '',
      os: os.name || '',
      ip: Array.isArray(ip) ? ip[0] : ip,
    }
  }

  async create(req: Request) {
    const user = req.user as unknown as UserDocument
    const deviceInfo = this.extractDeviceInfo(req)

    return this.sessionModel.create({
      user: user._id,
      deviceInfo,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000),
    })
  }

  async deleteOne(filter: FilterQuery<Session>) {
    return this.sessionModel.deleteOne(filter)
  }
}
