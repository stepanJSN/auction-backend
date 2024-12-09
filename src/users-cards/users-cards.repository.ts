import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllUsersCardsType } from './types/find-all-users-cards.type';

@Injectable()
export class UsersCardsRepository {
  constructor(private prisma: PrismaService) {}

  findAll({ cardId, userId }: FindAllUsersCardsType) {
    return this.prisma.users_cards.findMany({
      where: {
        card_id: cardId,
        user_id: userId,
      },
    });
  }
}
