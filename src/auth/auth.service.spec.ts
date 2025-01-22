import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { Role } from '@prisma/client';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

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
    it('should throw UnauthorizedException if user is not found', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(null);

      await expect(
        authService.signIn({
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue({
        id: '1',
        password: 'hashedPassword',
        role: Role.User,
      });
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.signIn({
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens and user data if sign-in is successful', async () => {
      const mockUser = {
        id: '1',
        password: 'hashedPassword',
        role: Role.User,
      };

      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('accessToken');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('refreshToken');

      expect(
        await authService.signIn({
          email: 'test@example.com',
          password: 'password',
        }),
      ).toEqual({
        refreshToken: {
          token: 'refreshToken',
          maxAge: 2678400000, // ONE_MONTH_IN_SECONDS * 1000
        },
        accessToken: 'accessToken',
        role: mockUser.role,
        id: mockUser.id,
      });
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });
});
