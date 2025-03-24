import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserType } from './types/update-user.type';
import { CreateUserType } from './types/create-user.type';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async create(createUser: CreateUserType) {
    const { id } = await this.prisma.users.create({
      data: createUser,
    });
    return id;
  }

  findOneByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        password: true,
        role: true,
        googleSub: true,
      },
    });
  }

  async findAll({
    page = 1,
    take = 10,
    isAdmin,
    sortType = 'creationDate',
    sortOrder = 'desc',
    fullName,
  }: FindAllUsersDto) {
    const condition = {
      role: isAdmin ? Role.Admin : undefined,
      ...(fullName && {
        OR: [
          {
            name: { contains: fullName.split(' ')[0] },
          },
          {
            surname: { contains: fullName.split(' ')[1] || '' },
          },
          {
            AND: [
              { name: { contains: fullName.split(' ')[0] } },
              { surname: { contains: fullName.split(' ')[1] || '' } },
            ],
          },
        ],
      }),
    };
    const [users, totalCount] = await this.prisma.$transaction([
      this.prisma.users.findMany({
        where: condition,
        select: {
          id: true,
          name: true,
          surname: true,
          rating: true,
          role: true,
        },
        orderBy: {
          [sortType === 'creationDate' ? 'created_at' : 'rating']: sortOrder,
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.users.count({ where: condition }),
    ]);
    return { users, totalCount };
  }

  findOneById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
      omit: {
        password: true,
      },
    });
  }

  async update(userId: string, updateUser: UpdateUserType) {
    try {
      return await this.prisma.users.update({
        where: { id: userId },
        data: updateUser,
        omit: {
          password: true,
        },
      });
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async deleteUser(userId: string) {
    try {
      return await this.prisma.users.delete({
        where: { id: userId },
        omit: {
          password: true,
        },
      });
    } catch {}
  }
}
