import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

@Injectable()
export class AwsS3Service implements OnModuleInit {
  private s3Client: S3Client
  private s3Bucket: string

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.s3Client = new S3Client({
      region: this.config.get<string>('S3_REGION') || 'your-region',
      credentials: {
        accessKeyId:
          this.config.get<string>('S3_ACCESS_KEY_ID') || 'your-access-key-id',
        secretAccessKey:
          this.config.get<string>('S3_SECRET_ACCESS_KEY') ||
          'your-secret-access-key',
      },
    })
    this.s3Bucket = this.config.get<string>('S3_BUCKET_NAME') || 'your-region'
  }

  async uploadPublicFile(
    fileKey: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const uploadParams: PutObjectCommandInput = {
      Bucket: this.s3Bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }

    const command = new PutObjectCommand(uploadParams)
    await this.s3Client.send(command)

    return `https://${this.s3Bucket}.s3.${this.config.get<string>('S3_REGION')}.amazonaws.com/${fileKey}`
  }

  async uploadPrivateFile(
    fileKey: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const uploadParams: PutObjectCommandInput = {
      Bucket: this.s3Bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    }

    const command = new PutObjectCommand(uploadParams)
    await this.s3Client.send(command)

    return fileKey
  }

  async getPrivateFileTempUrl(
    key: string,
    expiresIn: number = 24 * 60 * 60,
  ): Promise<string> {
    const params = { Bucket: this.s3Bucket, Key: key }

    const command = new GetObjectCommand(params)

    return getSignedUrl(this.s3Client, command, { expiresIn })
  }

  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: this.s3Bucket,
      Key: key,
    }

    const command = new DeleteObjectCommand(params)

    try {
      await this.s3Client.send(command)
      console.log(`File with key '${key}' deleted successfully.`)
    } catch (error) {
      console.log(`Error deleting file with key '${key}':`, error)
      throw error
    }
  }

  extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname.substring(1)
    } catch (error) {
      console.error(`Invalid URL format: ${url}`, error)
      throw new Error(`Invalid URL format: ${url}`)
    }
  }
}
