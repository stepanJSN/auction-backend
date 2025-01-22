import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeEach(async () => {
    authService = {
      signIn: jest.fn(),
      getNewAccessToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    authController = module.get(AuthController);
    authService = module.get(AuthService);
  });

  describe('signIn', () => {
    it('should return signInResponse and set refresh token cookie', async () => {
      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;
      const signInDto = { email: 'test@example.com', password: 'password123' };
      const mockSignInResponse = {
        refreshToken: { token: 'mockRefreshToken', maxAge: 3600 * 1000 },
        accessToken: 'mockAccessToken',
        role: 'User',
        id: 'userId',
      };

      authService.signIn.mockResolvedValue(mockSignInResponse);

      const result = await authController.signIn(mockResponse, signInDto);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        role: 'User',
        id: 'userId',
      });
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mockRefreshToken',
        {
          httpOnly: true,
          maxAge: 3600 * 1000,
          secure: true,
          sameSite: 'none',
        },
      );
    });
  });

  describe('getNewTokens', () => {
    it('should return new access token if refresh token is valid', async () => {
      const mockRequest = {
        cookies: { refreshToken: 'validRefreshToken' },
      } as unknown as Request;
      authService.getNewAccessToken.mockResolvedValue('newAccessToken');

      const result = await authController.getNewTokens(mockRequest);

      expect(authService.getNewAccessToken).toHaveBeenCalledWith(
        'validRefreshToken',
      );
      expect(result).toEqual({ accessToken: 'newAccessToken' });
    });

    it('should throw UnauthorizedException if refresh token is missing', async () => {
      const mockRequest = { cookies: {} } as unknown as Request;

      await expect(authController.getNewTokens(mockRequest)).rejects.toThrow(
        new UnauthorizedException('Refresh token not passed'),
      );
    });
  });

  describe('logout', () => {
    it('should clear the refresh token cookie', () => {
      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      authController.logout(mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', '', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        expires: new Date(0),
      });
    });
  });
});
