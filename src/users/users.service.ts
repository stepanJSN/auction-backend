import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  findOneByEmail(email: string) {
    return this.usersRepository.findOneByEmail(email);
  }
}
