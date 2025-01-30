import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { UsersService } from './users.service';
import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { Role } from '@prisma/client';
import { MOCK_EMAIL } from 'config/mock-test-data';
import { FindAllUsersDto } from './dto/find-all-users.dto';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: DeepMockProxy<UsersService>;
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
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: UsersService, useValue: mockDeep<UsersService>() },
      ],
    }).compile();

    usersController = module.get(UsersController);
    usersService = module.get(UsersService);
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUsersDto = {
        email: MOCK_EMAIL,
        name: 'User',
        surname: 'Surname',
        password: 'password',
      };
      const newUserId = 'userId';
      usersService.create.mockResolvedValue(newUserId);

      await expect(usersController.create(createUsersDto)).resolves.toBe(
        newUserId,
      );
      expect(usersService.create).toHaveBeenCalledWith(createUsersDto);
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
      const mockAllUsersServiceResponse = {
        data: mockUsers,
        info: {
          page: findAllUsersDto.page,
          totalCount: mockUsers.length,
          totalPages: 1,
        },
      };

      usersService.findAll.mockResolvedValue(mockAllUsersServiceResponse);

      await expect(usersController.findAll(findAllUsersDto)).resolves.toEqual(
        mockAllUsersServiceResponse,
      );
    });
  });

  describe('findOne', () => {
    const { stripe_account_id, ...mockUserWithStripeId } = mockUser;
    const mockUserWithBalance = {
      ...mockUserWithStripeId,
      balance: {
        total: 1000,
        available: 950,
      },
      has_stripe_account: !!stripe_account_id,
    };
    it('should find current user', async () => {
      usersService.findOneByIdWithBalance.mockResolvedValue(
        mockUserWithBalance,
      );
      await expect(
        usersController.findCurrentUser(mockUser.id),
      ).resolves.toEqual(mockUserWithBalance);
      expect(usersService.findOneByIdWithBalance).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
    it('should find user by provided id', async () => {
      usersService.findOneByIdWithBalance.mockResolvedValue(
        mockUserWithBalance,
      );
      await expect(usersController.findOneById(mockUser.id)).resolves.toEqual(
        mockUserWithBalance,
      );
      expect(usersService.findOneByIdWithBalance).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateUserDto = {
        name: 'Updated Name',
      };
      const mockUpdatedUser = {
        ...mockUser,
        name: updateUserDto.name,
      };
      usersService.update.mockResolvedValue(mockUpdatedUser);

      await expect(
        usersController.update(mockUser.id, updateUserDto),
      ).resolves.toEqual(mockUpdatedUser);
      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
      );
    });
  });

  describe('changeRole', () => {
    it('should update user role', async () => {
      const changeRoleDto = {
        userId: mockUser.id,
        role: Role.Admin,
      };
      const mockUpdatedUser = {
        ...mockUser,
        role: changeRoleDto.role,
      };
      usersService.changeRole.mockResolvedValue(mockUpdatedUser);

      await expect(usersController.changeRole(changeRoleDto)).resolves.toEqual(
        mockUpdatedUser,
      );
      expect(usersService.changeRole).toHaveBeenCalledWith(changeRoleDto);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      usersService.delete.mockResolvedValue(mockUser);
      expect(usersController.delete(mockUser.id)).toBeUndefined();
      expect(usersService.delete).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
