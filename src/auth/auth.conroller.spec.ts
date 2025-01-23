import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { Role } from '@prisma/client';
import {
  MOCK_ACCESS_TOKEN,
  MOCK_EMAIL,
  MOCK_PASSWORD,
  MOCK_REFRESH_TOKEN,
  MOCK_USER_ID,
} from 'config/mock-test-data';

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
      const signInDto = { email: MOCK_EMAIL, password: MOCK_PASSWORD };
      const mockSignInResponse = {
        refreshToken: { token: MOCK_REFRESH_TOKEN, maxAge: 3600 * 1000 },
        accessToken: MOCK_ACCESS_TOKEN,
        role: Role.User,
        id: MOCK_USER_ID,
      };
      const signInResponse = {
        accessToken: MOCK_ACCESS_TOKEN,
        role: Role.User,
        id: MOCK_USER_ID,
      };

      authService.signIn.mockResolvedValue(mockSignInResponse);

      const result = await authController.signIn(mockResponse, signInDto);

      expect(result).toEqual(signInResponse);
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        MOCK_REFRESH_TOKEN,
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
        cookies: { refreshToken: MOCK_REFRESH_TOKEN },
      } as unknown as Request;
      authService.getNewAccessToken.mockResolvedValue(MOCK_ACCESS_TOKEN);

      const result = await authController.getNewTokens(mockRequest);

      expect(authService.getNewAccessToken).toHaveBeenCalledWith(
        MOCK_REFRESH_TOKEN,
      );
      expect(result).toEqual({ accessToken: MOCK_ACCESS_TOKEN });
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
