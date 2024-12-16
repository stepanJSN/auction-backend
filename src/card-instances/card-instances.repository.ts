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
}
