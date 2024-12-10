import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllCardInstancesType } from './types/find-all-card-instances.type';

@Injectable()
export class CardInstancesRepository {
  constructor(private prisma: PrismaService) {}

  findAll({ cardsId, userId }: FindAllCardInstancesType) {
    return this.prisma.card_instances.findMany({
      where: {
        card_id: { in: cardsId },
        user_id: userId,
      },
    });
  }
}
