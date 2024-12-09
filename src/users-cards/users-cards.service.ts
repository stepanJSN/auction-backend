import { Injectable } from '@nestjs/common';
import { UsersCardsRepository } from './users-cards.repository';

@Injectable()
export class UsersCardsService {
  constructor(private usersCardsRepository: UsersCardsRepository) {}

  findAllByCardId(cardId: string) {
    return this.usersCardsRepository.findAll({ cardId });
  }

  findAllByUserId(userId: string) {
    return this.usersCardsRepository.findAll({ userId });
  }
}
