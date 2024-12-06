import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  private async hashPassword(password: string) {
    const saltRounds = 10;
    return await hash(password, saltRounds);
  }

  async create(createUsersDto: CreateUserDto) {
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

  findOneById(userId: string) {
    return this.usersRepository.findOneById(userId);
  }

  async update(userId: string, updateUsersDto: UpdateUserDto) {
    const user = await this.findOneById(userId);

    if (user) {
      throw new BadRequestException('User not found');
    }

    const userPassword = updateUsersDto.password
      ? await this.hashPassword(updateUsersDto.password)
      : user.password;

    return await this.usersRepository.update(userId, {
      ...updateUsersDto,
      password: userPassword,
    });
  }

  async changeRole(userId: string, changeRoleDto: ChangeRoleDto) {
    return await this.usersRepository.update(userId, changeRoleDto);
  }

  async updateRating(userId: string, rating: number) {
    return await this.usersRepository.update(userId, { rating });
  }
}
