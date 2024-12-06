import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUsersDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(15)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(15)
  surname: string;

  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password: string;
}
