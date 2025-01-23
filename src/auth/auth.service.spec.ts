import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { Role } from '@prisma/client';
import {
  MOCK_EMAIL,
  MOCK_PASSWORD,
  MOCK_HASHED_PASSWORD,
  MOCK_ACCESS_TOKEN,
  MOCK_REFRESH_TOKEN,
  MOCK_USER_ID,
} from 'config/mock-test-data';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
const ONE_MONTH_IN_SECONDS = 2678400;

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: JwtService;

  beforeEach(async () => {
    usersService = {
      findOneByEmail: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        JwtService,
      ],
    }).compile();

    authService = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  describe('signIn', () => {
    const mockSignInPayload = {
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
    };
    const mockUser = {
      id: MOCK_USER_ID,
      password: MOCK_HASHED_PASSWORD,
      role: Role.User,
    };

    it('should throw UnauthorizedException if user is not found', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(null);

      await expect(authService.signIn(mockSignInPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.signIn(mockSignInPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return tokens and user data if sign-in is successful', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce(MOCK_ACCESS_TOKEN);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce(MOCK_REFRESH_TOKEN);

      const signInResponse = {
        refreshToken: {
          token: MOCK_REFRESH_TOKEN,
          maxAge: ONE_MONTH_IN_SECONDS * 1000,
        },
        accessToken: MOCK_ACCESS_TOKEN,
        role: mockUser.role,
        id: mockUser.id,
      };

      expect(await authService.signIn(mockSignInPayload)).toEqual(
        signInResponse,
      );
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        mockSignInPayload.email,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });
});
