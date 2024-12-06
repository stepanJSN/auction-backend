import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserType } from './types/createUser.type';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

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

  async create(createUsersDto: CreateUserType) {
    const { id } = await this.prisma.users.create({
      data: {
        email: createUsersDto.email,
        name: createUsersDto.name,
        surname: createUsersDto.surname,
        password: createUsersDto.password,
      },
    });
    return id;
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
}
