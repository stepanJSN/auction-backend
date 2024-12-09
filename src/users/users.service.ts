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

  async findOneById(userId: string) {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async update(userId: string, updateUsersDto: UpdateUserDto) {
    await this.findOneById(userId);

    const userPassword =
      updateUsersDto.password &&
      (await this.hashPassword(updateUsersDto.password));

    return await this.usersRepository.update(userId, {
      ...updateUsersDto,
      password: userPassword,
    });
  }

  async changeRole({ userId, role }: ChangeRoleDto) {
    await this.findOneById(userId);
    return await this.usersRepository.update(userId, { role });
  }

  async updateRating(userId: string, rating: number) {
    await this.findOneById(userId);
    return this.usersRepository.update(userId, { rating });
  }

  async delete(userId: string) {
    await this.findOneById(userId);
    return await this.usersRepository.deleteUser(userId);
  }
}
