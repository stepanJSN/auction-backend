import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersRepository } from './users.repository';
import { MOCK_DATE, MOCK_EMAIL, MOCK_USER_ID } from 'config/mock-test-data';
import { Role } from '@prisma/client';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { NotFoundException } from '@nestjs/common';

describe('UsersRepository', () => {
  let usersRepository: UsersRepository;
  let prisma: DeepMockProxy<PrismaService>;
  const mockUser = {
    id: MOCK_USER_ID,
    email: MOCK_EMAIL,
    name: 'User 1',
    surname: 'UserSurname',
    created_at: MOCK_DATE,
    rating: 0,
    role: Role.User,
    stripe_account_id: null,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    usersRepository = module.get(UsersRepository);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: MOCK_EMAIL,
        name: 'User 1',
        surname: 'UserSurname',
        password: 'hashedPassword',
      };
      const mockNewUser = {
        ...createUserDto,
        id: MOCK_USER_ID,
        created_at: MOCK_DATE,
        rating: 0,
        role: Role.User,
        stripe_account_id: null,
      };

      prisma.users.create.mockResolvedValue(mockNewUser);
      await expect(usersRepository.create(createUserDto)).resolves.toBe(
        mockNewUser.id,
      );
      expect(prisma.users.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
    });
  });

  describe('findOneByEmail', () => {
    it('should find a user by email', async () => {
      const email = MOCK_EMAIL;
      const mockUser = {
        id: MOCK_USER_ID,
        password: 'hashedPassword',
        role: Role.User,
      };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      await expect(usersRepository.findOneByEmail(email)).resolves.toEqual(
        mockUser,
      );
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: {
          email,
        },
        select: {
          id: true,
          password: true,
          role: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should find all users', async () => {
      const userName = 'John';
      const userSurname = 'Doe';
      const findAllUsersDto: FindAllUsersDto = {
        page: 1,
        take: 10,
        isAdmin: true,
        sortType: 'creationDate',
        sortOrder: 'desc',
        fullName: `${userName} ${userSurname}`,
      };
      const mockUsers = [
        {
          id: MOCK_USER_ID,
          name: userName,
          surname: userSurname,
          rating: 0,
          role: Role.Admin,
        },
      ];
      const expectedCondition = {
        role: Role.Admin,
        OR: [
          {
            name: { contains: userName },
          },
          {
            surname: { contains: userSurname },
          },
          {
            AND: [
              { name: { contains: userName } },
              { surname: { contains: userSurname } },
            ],
          },
        ],
      };
      prisma.$transaction.mockResolvedValue([mockUsers, mockUsers.length]);

      await expect(usersRepository.findAll(findAllUsersDto)).resolves.toEqual({
        users: mockUsers,
        totalCount: mockUsers.length,
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.users.findMany({
          where: expectedCondition,
          orderBy: { [findAllUsersDto.sortType]: findAllUsersDto.sortOrder },
          take: findAllUsersDto.take,
          skip: (findAllUsersDto.page - 1) * findAllUsersDto.take,
        }),
        prisma.users.count({
          where: expectedCondition,
        }),
      ]);
    });
  });

  describe('findOneById', () => {
    it('should find a user by id', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      await expect(usersRepository.findOneById(mockUser.id)).resolves.toEqual(
        mockUser,
      );
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        omit: {
          password: true,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a user if it exists', async () => {
      const updateUserDto = {
        name: 'Updated Name',
      };
      const mockUpdatedUser = {
        ...mockUser,
        name: updateUserDto.name,
      };
      prisma.users.update.mockResolvedValue(mockUpdatedUser as any);

      await expect(
        usersRepository.update(mockUser.id, updateUserDto),
      ).resolves.toEqual(mockUpdatedUser);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateUserDto,
        omit: {
          password: true,
        },
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      const userId = 'non-existing-id';
      const updateUserDto = {
        name: 'Updated Name',
      };
      prisma.users.update.mockRejectedValue(
        new Error('Prisma not found error'),
      );

      await expect(
        usersRepository.update(userId, updateUserDto),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
        omit: {
          password: true,
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a user if it exists', async () => {
      prisma.users.delete.mockResolvedValue(mockUser as any);

      await expect(usersRepository.deleteUser(mockUser.id)).resolves.toEqual(
        mockUser,
      );
      expect(prisma.users.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        omit: {
          password: true,
        },
      });
    });

    it('should return undefined if user is not found', async () => {
      const userId = 'non-existing-id';
      prisma.users.delete.mockRejectedValue(
        new Error('Prisma not found error'),
      );

      await expect(usersRepository.deleteUser(userId)).resolves.toBeUndefined();
      expect(prisma.users.delete).toHaveBeenCalledWith({
        where: { id: userId },
        omit: {
          password: true,
        },
      });
    });
  });
});
