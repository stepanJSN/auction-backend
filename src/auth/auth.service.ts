import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JWTPayload } from './types/auth.type';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { SignInRequestDto } from './dto/signIn.dto';
import { compare } from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

const ONE_MONTH_IN_SECONDS = 2678400;
const TEN_MINUTES_IN_SECONDS = 600;

@Injectable()
export class AuthService {
  private authClient = new OAuth2Client();
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
    private configService: ConfigService,
  ) {}
  private generateToken(
    payload: JWTPayload,
    expiresIn: number,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, { expiresIn });
  }

  private calcExpiationTime(age: number) {
    return new Date(Date.now() + age * 1000);
  }

  private async validateUserCredentials(email: string, password: string) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid login or password');

    const isValid = await compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid login or password');

    return user;
  }

  private async generateTokens(payload: JWTPayload) {
    const accessToken = await this.generateToken(
      payload,
      TEN_MINUTES_IN_SECONDS,
    );
    const refreshToken = await this.generateToken(
      payload,
      ONE_MONTH_IN_SECONDS,
    );

    return {
      refreshToken: {
        token: refreshToken,
        maxAge: ONE_MONTH_IN_SECONDS * 1000,
      },
      accessToken: {
        token: accessToken,
        exp: this.calcExpiationTime(TEN_MINUTES_IN_SECONDS),
      },
    };
  }

  async signInWithCredentials(signInRequestDto: SignInRequestDto) {
    const { email, password } = signInRequestDto;
    const user = await this.validateUserCredentials(email, password);
    const tokens = await this.generateTokens({
      id: user.id,
      email: email,
      role: user.role,
    });
    return {
      ...tokens,
      role: user.role,
      id: user.id,
    };
  }

  async getNewAccessToken(refreshToken: string) {
    const result = await this.jwtService.verifyAsync(refreshToken);
    if (!result) throw new UnauthorizedException('Invalid refresh token');
    const accessToken = await this.generateToken(
      { id: result.id, email: result.email, role: result.role },
      TEN_MINUTES_IN_SECONDS,
    );
    return {
      accessToken: {
        token: accessToken,
        exp: this.calcExpiationTime(TEN_MINUTES_IN_SECONDS),
      },
    };
  }

  async signInWithGoogle(accessToken: string) {
    const ticket = await this.authClient.verifyIdToken({
      idToken: accessToken,
      audience: this.configService.get<string>('google_auth_client_id'),
    });
    const payload = ticket.getPayload();

    const user = await this.userService.findOneByEmail(payload.email);
    let tokenPayload: JWTPayload;

    if (user) {
      if (!user.googleSub) {
        await this.userService.update(user.id, {
          googleSub: payload.sub,
        });
      }
      if (user.googleSub && user.googleSub !== payload.sub) {
        throw new UnauthorizedException('Your Google account is not the same');
      }
      tokenPayload = {
        id: user.id,
        email: payload.email,
        role: user.role,
      };
    } else {
      const newUserId = await this.userService.create({
        email: payload.email,
        name: payload.given_name,
        surname: payload.family_name,
        googleSub: payload.sub,
      });
      tokenPayload = {
        id: newUserId,
        email: payload.email,
        role: Role.User,
      };
    }

    const tokens = await this.generateTokens(tokenPayload);
    return {
      ...tokens,
      role: tokenPayload.role,
      id: tokenPayload.id,
    };
  }
}
