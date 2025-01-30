import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { TransactionsService } from 'src/transactions/transactions.service';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { MOCK_EMAIL } from 'config/mock-test-data';
import { hash } from 'bcrypt';
import { Role } from '@prisma/client';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RatingAction } from './events/update-rating.event';

jest.mock('bcrypt');

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: DeepMockProxy<UsersRepository>;
  let transactionsService: Partial<
    Record<keyof TransactionsService, jest.Mock>
  >;
  const mockUser = {
    id: 'userId',
    email: MOCK_EMAIL,
    name: 'User',
    surname: 'Surname',
    created_at: new Date(),
    rating: 0,
    role: Role.User,
    stripe_account_id: null,
  };

  beforeEach(async () => {
    const mockedTransactionsService = {
      calculateBalance: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockDeep<UsersRepository>() },
        { provide: TransactionsService, useValue: mockedTransactionsService },
      ],
    }).compile();

    usersService = module.get(UsersService);
    usersRepository = module.get(UsersRepository);
    transactionsService = module.get(TransactionsService);
  });

  describe('create', () => {
    it('should create a user and hash password', async () => {
      const createUsersDto = {
        email: MOCK_EMAIL,
        name: 'User',
        surname: 'Surname',
        password: 'password',
      };
      const newUserId = 'userId';
      const hashedPassword = 'hashedPassword';

      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(null);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersRepository.create.mockResolvedValue(newUserId);
      await expect(usersService.create(createUsersDto)).resolves.toEqual(
        newUserId,
      );
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        createUsersDto.email,
      );
      expect(usersRepository.create).toHaveBeenCalledWith({
        email: createUsersDto.email,
        name: createUsersDto.name,
        surname: createUsersDto.surname,
        password: hashedPassword,
      });
    });

    it('should throw an ConflictException if user with provided email already exists', async () => {
      const createUsersDto = {
        email: 'duplicatedEmail',
        name: 'User',
        surname: 'Surname',
        password: 'password',
      };

      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue({
        ...mockUser,
        email: createUsersDto.email,
      } as any);
      await expect(usersService.create(createUsersDto)).rejects.toThrow(
        new ConflictException('User already exists'),
      );
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        createUsersDto.email,
      );
      expect(usersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOneByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@email.com';
      const mockUserWithEmail = {
        ...mockUser,
        email,
      };
      usersRepository.findOneByEmail.mockResolvedValue(
        mockUserWithEmail as any,
      );
      await expect(usersService.findOneByEmail(email)).resolves.toEqual(
        mockUserWithEmail,
      );
      expect(usersRepository.findOneByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('findAll', () => {
    it('should find all users', async () => {
      const findAllUsersDto: FindAllUsersDto = {
        page: 1,
        take: 10,
        sortType: 'creationDate',
        sortOrder: 'desc',
      };
      const mockUsers = [
        {
          id: 'user1',
          name: 'User 1',
          surname: 'Surname 1',
          rating: 12,
          role: Role.User,
        },
      ];

      usersRepository.findAll.mockResolvedValue({
        users: mockUsers,
        totalCount: mockUsers.length,
      });

      await expect(usersService.findAll(findAllUsersDto)).resolves.toEqual({
        data: mockUsers,
        info: {
          page: findAllUsersDto.page,
          totalCount: mockUsers.length,
          totalPages: 1,
        },
      });
      expect(usersRepository.findAll).toHaveBeenCalledWith(findAllUsersDto);
    });
  });

  describe('findOneById', () => {
    it('should find a user by id if it exists', async () => {
      usersRepository.findOneById.mockResolvedValue(mockUser);

      await expect(usersService.findOneById(mockUser.id)).resolves.toEqual(
        mockUser,
      );
      expect(usersRepository.findOneById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const userId = 'non-existing-id';
      usersRepository.findOneById.mockResolvedValue(null);

      await expect(usersService.findOneById(userId)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(usersRepository.findOneById).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOneByIdWithBalance', () => {
    it('should find a user by id and return user data + balance', async () => {
      const userBalance = {
        total: 1000,
        available: 950,
      };
      usersRepository.findOneById.mockResolvedValue(mockUser);
      transactionsService.calculateBalance.mockResolvedValue(userBalance);

      const { stripe_account_id, ...restUserMock } = mockUser;
      await expect(
        usersService.findOneByIdWithBalance(mockUser.id),
      ).resolves.toEqual({
        ...restUserMock,
        has_stripe_account: !!stripe_account_id,
        balance: userBalance,
      });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const hashedPassword = 'hashedPassword';
      const updateUserDto = {
        name: 'Updated Name',
        password: 'newPassword',
      };
      const mockUpdatedUser = {
        ...mockUser,
        name: updateUserDto.name,
        password: hashedPassword,
      };
      (hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersRepository.update.mockResolvedValue(mockUpdatedUser as any);

      await expect(
        usersService.update(mockUser.id, updateUserDto),
      ).resolves.toEqual(mockUpdatedUser);
      expect(usersRepository.update).toHaveBeenCalledWith(mockUser.id, {
        name: updateUserDto.name,
        password: hashedPassword,
      });
    });
  });

  describe('changeRole', () => {
    it('should update user role', async () => {
      const updateUserRoleDto = {
        userId: mockUser.id,
        role: Role.Admin,
      };
      const mockUpdatedUser = {
        ...mockUser,
        role: updateUserRoleDto.role,
      };
      usersRepository.update.mockResolvedValue(mockUpdatedUser as any);

      await expect(usersService.changeRole(updateUserRoleDto)).resolves.toEqual(
        mockUpdatedUser,
      );
      expect(usersRepository.update).toHaveBeenCalledWith(mockUser.id, {
        role: updateUserRoleDto.role,
      });
    });
  });

  describe('updateRating', () => {
    it('should increase user rating if rating action is increase', async () => {
      const updateRatingEvent = {
        userId: mockUser.id,
        pointsAmount: 10,
        action: RatingAction.INCREASE,
      };
      usersRepository.findOneById.mockResolvedValue(mockUser);

      await usersService.updateRating(updateRatingEvent);
      expect(usersRepository.findOneById).toHaveBeenCalledWith(mockUser.id);
      expect(usersRepository.update).toHaveBeenCalledWith(mockUser.id, {
        rating: updateRatingEvent.pointsAmount + mockUser.rating,
      });
    });
    it('should decrease user rating if rating action is decrease', async () => {
      const updateRatingEvent = {
        userId: mockUser.id,
        pointsAmount: 10,
        action: RatingAction.DECREASE,
      };
      usersRepository.findOneById.mockResolvedValue(mockUser);

      await usersService.updateRating(updateRatingEvent);
      expect(usersRepository.findOneById).toHaveBeenCalledWith(mockUser.id);
      expect(usersRepository.update).toHaveBeenCalledWith(mockUser.id, {
        rating: mockUser.rating - updateRatingEvent.pointsAmount,
      });
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      usersRepository.deleteUser.mockResolvedValue(mockUser);
      await expect(usersService.delete(mockUser.id)).resolves.toEqual(mockUser);
      expect(usersRepository.deleteUser).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
