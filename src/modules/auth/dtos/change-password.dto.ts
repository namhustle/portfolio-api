import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty({ type: String })
  @IsString()
  @Length(8, 100, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
    {
      message:
        'Password must contain at least one uppercase letter, one number, and one special character',
    },
  )
  @IsNotEmpty()
  currentPassword: string

  @ApiProperty({ type: String })
  @IsString()
  @Length(8, 100, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
    {
      message:
        'Password must contain at least one uppercase letter, one number, and one special character',
    },
  )
  @IsNotEmpty()
  newPassword: string
}
