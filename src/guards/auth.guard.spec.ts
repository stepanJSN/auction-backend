import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { MOCK_EMAIL, MOCK_USER_ID } from 'config/mock-test-data';

const MOCK_SECRET = 'mockSecret';
const BEARER_TOKEN = 'Bearer mockToken';
const MOCK_TOKEN = 'mockToken';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;
  let configService: ConfigService;

  beforeEach(async () => {
    reflector = new Reflector();
    const module = await Test.createTestingModule({
      providers: [AuthGuard, JwtService, ConfigService],
    }).compile();
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    authGuard = new AuthGuard(jwtService, reflector, configService);
  });

  describe('canActivate', () => {
    const mockPayload = {
      id: MOCK_USER_ID,
      role: Role.User,
      email: MOCK_EMAIL,
    };
    const mockRequest = {
      headers: { authorization: BEARER_TOKEN },
    };
    const mockClient = {
      handshake: { auth: { token: BEARER_TOKEN }, headers: {} },
    };

    it('should allow access if the route is public', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getType: jest.fn().mockReturnValue('http'),
      } as unknown as ExecutionContext;

      const result = await authGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException if no token is provided (HTTP)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getType: jest.fn().mockReturnValue('http'),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ headers: {} }),
        }),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Missing authentication token'),
      );
    });

    it('should throw UnauthorizedException if no token is expired or invalid (HTTP)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Token expired'));
      jest.spyOn(configService, 'get').mockReturnValue(MOCK_SECRET);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getType: jest.fn().mockReturnValue('http'),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired authentication token'),
      );
    });

    it('should validate token and attach user to request (HTTP)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(configService, 'get').mockReturnValue(MOCK_SECRET);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getType: jest.fn().mockReturnValue('http'),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = await authGuard.canActivate(context);
      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(MOCK_TOKEN, {
        secret: BEARER_TOKEN,
      });
      expect(mockRequest['user']).toEqual(mockPayload);
    });

    it('should throw WsException if no token is provided (WebSocket)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getType: jest.fn().mockReturnValue('ws'),
        switchToWs: jest.fn().mockReturnValue({
          getClient: jest.fn().mockReturnValue({
            handshake: { auth: {}, headers: {} },
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(context)).rejects.toThrow(
        new WsException('Missing authentication token'),
      );
    });

    it('should throw UnauthorizedException if no token is expired or invalid (WebSocket)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Token expired'));
      jest.spyOn(configService, 'get').mockReturnValue(MOCK_SECRET);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getType: jest.fn().mockReturnValue('ws'),
        switchToWs: jest.fn().mockReturnValue({
          getClient: jest.fn().mockReturnValue(mockClient),
        }),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(context)).rejects.toThrow(
        new WsException('Invalid or expired authentication token'),
      );
    });

    it('should validate token and attach user to client (WebSocket)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(configService, 'get').mockReturnValue(MOCK_SECRET);

      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getType: jest.fn().mockReturnValue('ws'),
        switchToWs: jest.fn().mockReturnValue({
          getClient: jest.fn().mockReturnValue(mockClient),
        }),
      } as unknown as ExecutionContext;

      const result = await authGuard.canActivate(context);
      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(MOCK_TOKEN, {
        secret: MOCK_SECRET,
      });
      expect(mockClient['user']).toEqual(mockPayload);
    });
  });
});
