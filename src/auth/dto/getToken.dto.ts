import { IsJWT } from 'class-validator';

export class GetTokenDto {
  @IsJWT()
  refreshToken: string;
}
