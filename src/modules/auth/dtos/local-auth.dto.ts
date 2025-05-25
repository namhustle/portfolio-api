import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LocalLoginDto {
  @ApiProperty({ type: String, example: 'john_doe123@example.com' })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    type: String,
    example: 'Johndoe@123',
  })
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
  password: string
}

export class LocalRegisterDto extends LocalLoginDto {
  @ApiProperty({
    type: String,
    example: 'Joe Doe',
  })
  @IsString()
  @Length(1, 50)
  @IsNotEmpty()
  fullName: string
}
