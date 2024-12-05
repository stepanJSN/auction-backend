import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JWTPayload } from './types/auth.type';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import { SignInResponseDto } from './dto/signIn.dto';
import * as bcrypt from 'bcrypt';

const ONE_MONTH_IN_SECONDS = 2678400;
const TEN_MINUTES_IN_SECONDS = 600;

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
  ) {}
  private async generateToken(
    payload: JWTPayload,
    expiresIn: number,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, { expiresIn });
  }

  private async generateAndSetRefreshToken(
    response: Response,
    payload: JWTPayload,
    expiresIn: number,
  ) {
    const refreshToken = await this.generateToken(payload, expiresIn);

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: expiresIn * 1000,
      secure: true,
      sameSite: 'none',
    });
  }

  private async validateUserCredentials(email: string, password: string) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid login or password');

    const isValid = await bcrypt.compare(user.password, password);
    if (!isValid) throw new UnauthorizedException('Invalid login or password');

    return user;
  }

  async signIn(
    response: Response,
    email: string,
    password: string,
  ): Promise<SignInResponseDto> {
    const user = await this.validateUserCredentials(email, password);

    const access_token = await this.generateToken(
      { id: user.id, role: user.role, email },
      TEN_MINUTES_IN_SECONDS,
    );
    await this.generateAndSetRefreshToken(
      response,
      { id: user.id, email, role: user.role },
      ONE_MONTH_IN_SECONDS,
    );

    return {
      access_token,
      role: user.role,
      id: user.id,
    };
  }

  removeRefreshTokenFromResponse(response: Response) {
    response.cookie('refreshToken', '', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      expires: new Date(0),
    });
  }
}
