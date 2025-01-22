import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';
import { ChangeRoleDto } from './dto/change-role.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { RatingAction, UpdateRatingEvent } from './events/update-rating.event';
import { RatingEvent } from './enums/rating-event.enum';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Role } from '@prisma/client';
import { UpdateUserType } from './types/update-user.type';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private transactionsService: TransactionsService,
  ) {}

  private hashPassword(password: string) {
    const saltRounds = 10;
    return hash(password, saltRounds);
  }

  async create(createUsersDto: CreateUserDto) {
    const user = await this.findOneByEmail(createUsersDto.email);

    if (user) {
      throw new ConflictException('User already exists');
    }

    return this.usersRepository.create({
      email: createUsersDto.email,
      name: createUsersDto.name,
      surname: createUsersDto.surname,
      password: await this.hashPassword(createUsersDto.password),
    });
  }

  findOneByEmail(email: string) {
    return this.usersRepository.findOneByEmail(email);
  }

  async findAll({ page = 1, take = 10, ...findAllUsersDto }: FindAllUsersDto) {
    const { users, totalCount } = await this.usersRepository.findAll({
      page,
      take,
      ...findAllUsersDto,
    });
    return {
      data: users,
      info: {
        page,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    };
  }

  async findOneById(userId: string) {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOneByIdWithBalance(userId: string) {
    const { rating, stripe_account_id, role, ...restData } =
      await this.findOneById(userId);
    const balance = await this.transactionsService.calculateBalance(userId);

    return {
      ...restData,
      rating: role === Role.User ? rating : null,
      has_stripe_account: !!stripe_account_id,
      balance,
    };
  }

  async update(userId: string, updateUsersDto: UpdateUserType) {
    const userPassword =
      updateUsersDto.password &&
      (await this.hashPassword(updateUsersDto.password));

    return this.usersRepository.update(userId, {
      ...updateUsersDto,
      password: userPassword,
    });
  }

  changeRole({ userId, role }: ChangeRoleDto) {
    return this.usersRepository.update(userId, { role });
  }

  @OnEvent(RatingEvent.UPDATE)
  async updateRating({ userId, pointsAmount, action }: UpdateRatingEvent) {
    const { rating } = await this.findOneById(userId);
    return this.usersRepository.update(userId, {
      rating:
        action === RatingAction.INCREASE
          ? rating + pointsAmount
          : rating - pointsAmount,
    });
  }

  delete(userId: string) {
    return this.usersRepository.deleteUser(userId);
  }
}
