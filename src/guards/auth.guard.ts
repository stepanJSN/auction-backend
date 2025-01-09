import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { JWTPayload } from 'src/auth/types/auth.type';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const type = context.getType();

    if (type === 'http') {
      return this.validateHttpRequest(context);
    } else if (type === 'ws') {
      return this.validateWsRequest(context);
    }

    return false;
  }

  private async validateHttpRequest(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }
    const payload = await this.validateToken(token);
    if (!payload) {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
    request['user'] = payload;
    return true;
  }

  async validateWsRequest(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const authHeader =
      client.handshake.auth.token || client.handshake.headers.authorization;

    const token = this.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new WsException('Missing authentication token');
    }
    const payload = await this.validateToken(token);
    if (!payload) {
      throw new WsException('Invalid or expired authentication token');
    }
    client['user'] = payload;
    return true;
  }

  private extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  private async validateToken(token: string): Promise<JWTPayload | null> {
    try {
      const secret = this.configService.get<string>('jwt_key');
      return (await this.jwtService.verifyAsync(token, {
        secret,
      })) as JWTPayload;
    } catch {
      return null;
    }
  }
}
