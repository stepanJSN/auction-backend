import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JWTPayload } from './types/auth.type';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { SignInRequestDto } from './dto/signIn.dto';
import { compare } from 'bcrypt';

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

  private async validateUserCredentials(email: string, password: string) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid login or password');

    const isValid = await compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid login or password');

    return user;
  }

  async signIn(signInRequestDto: SignInRequestDto) {
    const { email, password } = signInRequestDto;
    const user = await this.validateUserCredentials(email, password);
    const tokenPayload = { id: user.id, role: user.role, email };

    const accessToken = await this.generateToken(
      tokenPayload,
      TEN_MINUTES_IN_SECONDS,
    );
    const refreshToken = await this.generateToken(
      tokenPayload,
      ONE_MONTH_IN_SECONDS,
    );

    return {
      refreshToken: {
        token: refreshToken,
        maxAge: ONE_MONTH_IN_SECONDS * 1000,
      },
      accessToken,
      role: user.role,
      id: user.id,
    };
  }

  async getNewAccessToken(refreshToken: string) {
    const result = await this.jwtService.verifyAsync(refreshToken);
    if (!result) throw new UnauthorizedException('Invalid refresh token');
    return await this.generateToken(result, TEN_MINUTES_IN_SECONDS);
  }
}
