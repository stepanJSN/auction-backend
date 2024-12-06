import { Body, Controller, Get, Post } from '@nestjs/common';
import { SignInRequestDto } from './dto/signIn.dto';
import { AuthService } from './auth.service';
import { Public } from 'src/decorators/public.decorator';
import { GetTokenDto } from './dto/getToken.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signin')
  signIn(@Body() signInDto: SignInRequestDto) {
    return this.authService.signIn(signInDto);
  }

  @Public()
  @Get('access-token')
  async getNewTokens(@Body() getToken: GetTokenDto) {
    return this.authService.getNewAccessToken(getToken.refreshToken);
  }
}
