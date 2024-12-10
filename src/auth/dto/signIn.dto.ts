import { Role } from '@prisma/client';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SignInRequestDto {
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password: string;
}

export class SignInResponseDto {
  access_token: string;
  role: Role;
  id: string;
}
