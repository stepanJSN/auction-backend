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
  @Post('signin')
  async signIn(
    @Res({ passthrough: true }) response: Response,
    @Body() signInDto: SignInRequestDto,
  ) {
    const { refreshToken, ...signInResponse } =
      await this.authService.signIn(signInDto);

    response.cookie('refreshToken', refreshToken.token, {
      httpOnly: true,
      maxAge: refreshToken.maxAge,
      secure: true,
      sameSite: 'none',
    });

    return signInResponse;
  }

  @Public()
  @Get('access-token')
  async getNewTokens(@Req() req: Request) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not passed');
    }

    return this.authService.getNewAccessToken(refreshToken);
  }

  @Public()
  @Get('logout')
  logout(@Res() response: Response) {
    response.cookie('refreshToken', '', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      expires: new Date(0),
    });
    return { success: true };
  }
}
