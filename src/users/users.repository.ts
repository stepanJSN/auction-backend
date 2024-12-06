import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserType } from './types/update-user.type';
import { CreateUserType } from './types/createUser.type';

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

  findAll(page: number, take: number) {
    return this.prisma.users.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        rating: true,
        role: true,
      },
      skip: (page - 1) * take,
      take,
    });
  }

  findOneById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }

  async update(userId: string, updateUser: UpdateUserType) {
    return await this.prisma.users.update({
      where: { id: userId },
      data: updateUser,
    });
  }

  async deleteUser(userId: string) {
    return await this.prisma.users.delete({ where: { id: userId } });
  }
}
