import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllCardInstancesType } from './types/find-all-card-instances.type';
import { CreateCardInstanceType } from './types/create-card-instance.type';
import { UpdateCardInstanceType } from './types/update-card-instance.type';

@Injectable()
export class CardInstancesRepository {
  constructor(private prisma: PrismaService) {}

  create({ cardId, userId }: CreateCardInstanceType) {
    return this.prisma.card_instances.create({
      data: {
        card_id: cardId,
        user_id: userId,
      },
    });
  }

  findOne(cardInstanceId: string) {
    return this.prisma.card_instances.findUnique({
      where: { id: cardInstanceId },
    });
  }

  findAll({ cardsId, userId }: FindAllCardInstancesType) {
    return this.prisma.card_instances.findMany({
      where: {
        card_id: { in: cardsId },
        user_id: userId,
      },
    });
  }

  update(cardInstanceId: string, cardInstanceData: UpdateCardInstanceType) {
    return this.prisma.card_instances.update({
      where: { id: cardInstanceId },
      data: {
        card_id: cardInstanceData.cardId,
        user_id: cardInstanceData.userId,
      },
    });
  }

  count(cardId: string) {
    return this.prisma.card_instances.count({ where: { card_id: cardId } });
  }

  mostRepeatedCard() {
    return this.prisma.card_instances.groupBy({
      by: ['card_id'],
      _count: {
        card_id: true,
      },
      orderBy: {
        _count: {
          card_id: 'desc',
        },
      },
      take: 1,
    });
  }

  leastRepeatedCard() {
    return this.prisma.card_instances.groupBy({
      by: ['card_id'],
      _count: {
        card_id: true,
      },
      orderBy: {
        _count: {
          card_id: 'asc',
        },
      },
      take: 1,
    });
  }
}
