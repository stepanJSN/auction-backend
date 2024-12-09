import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserType } from './types/update-user.type';
import { CreateUserType } from './types/create-user.type';

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
      },
    });
  }

  async findAll(page: number, take: number) {
    const [users, totalCount] = await this.prisma.$transaction([
      this.prisma.users.findMany({
        select: {
          id: true,
          name: true,
          surname: true,
          rating: true,
          role: true,
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.users.count(),
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

  update(userId: string, updateUser: UpdateUserType) {
    return this.prisma.users.update({
      where: { id: userId },
      data: updateUser,
      omit: {
        password: true,
      },
    });
  }

  deleteUser(userId: string) {
    return this.prisma.users.delete({
      where: { id: userId },
      omit: {
        password: true,
      },
    });
  }
}
