import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCardType } from './types/create-card.type';
import { UpdateCardType } from './types/update-card.type';
import { FindAllCardsType } from './types/find-all-cards.type';

@Injectable()
export class CardsRepository {
  constructor(private prisma: PrismaService) {}

  async create(createCard: CreateCardType) {
    const { id } = await this.prisma.cards.create({
      data: {
        ...createCard,
        image_url: '',
      },
    });
    return id;
  }

  findAll({ active, page, take }: FindAllCardsType) {
    return this.prisma.cards.findMany({
      where: {
        is_active: active,
      },
      skip: (page - 1) * take,
      take,
    });
  }

  findOneById(cardId: string) {
    return this.prisma.cards.findUnique({
      where: { id: cardId },
    });
  }

  update(cardId: string, updateCardData: UpdateCardType) {
    return this.prisma.cards.update({
      where: { id: cardId },
      data: updateCardData,
    });
  }

  delete(cardId: string) {
    return this.prisma.cards.delete({ where: { id: cardId } });
  }
}
