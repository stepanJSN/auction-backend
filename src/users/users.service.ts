import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUsersDto } from './dto/create-users.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  private async hashPassword(password: string) {
    const saltRounds = 10;
    return await hash(password, saltRounds);
  }

  async create(createUsersDto: CreateUsersDto) {
    const user = await this.findOneByEmail(createUsersDto.email);

    if (user) {
      throw new BadRequestException('User already exists');
    }

    return await this.usersRepository.create({
      email: createUsersDto.email,
      name: createUsersDto.name,
      surname: createUsersDto.surname,
      password: await this.hashPassword(createUsersDto.password),
    });
  }

  findOneByEmail(email: string) {
    return this.usersRepository.findOneByEmail(email);
  }

  findAll(page = 1, take = 10) {
    return this.usersRepository.findAll(page, take);
  }
}
