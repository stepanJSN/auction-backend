import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SignInRequestDto } from './dto/signIn.dto';
import { AuthService } from './auth.service';
import { Public } from 'src/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signin/google')
  async signInViaGoogle(@Body() signInDto: { accessToken: string }) {
    await this.authService.signInViaGoogle(signInDto.accessToken);
    return;
  }

  @Public()
  @Post('signin')
  async signIn(
    @Res({ passthrough: true }) response: Response,
    @Body() signInDto: SignInRequestDto,
  ) {
    const signInResponse = await this.authService.signIn(signInDto);

    response.cookie('refreshToken', signInResponse.refreshToken.token, {
      httpOnly: true,
      maxAge: signInResponse.refreshToken.maxAge,
      secure: true,
      sameSite: 'none',
    });

    return signInResponse;
  }

  @Public()
  @Post('access-token')
  async getNewTokens(
    @Body() { refreshToken }: { refreshToken: string },
    @Req() req: Request,
  ) {
    const cookieRefreshToken = req.cookies['refreshToken'];
    if (!cookieRefreshToken && !refreshToken) {
      throw new UnauthorizedException('Refresh token not passed');
    }

    return this.authService.getNewAccessToken(refreshToken);
  }

  @Public()
  @Get('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.cookie('refreshToken', '', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      expires: new Date(0),
    });
  }
}
