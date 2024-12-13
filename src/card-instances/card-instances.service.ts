import { Injectable } from '@nestjs/common';
import { CardInstancesRepository } from './card-instances.repository';
import { FindAllCardInstancesType } from './types/find-all-card-instances.type';
import { CreateCardInstanceType } from './types/create-card-instance.type';
import type { cards as CardType } from '@prisma/client';

@Injectable()
export class CardInstancesService {
  constructor(private cardInstancesRepository: CardInstancesRepository) {}

  create(cardInstanceData: CreateCardInstanceType) {
    return this.cardInstancesRepository.create(cardInstanceData);
  }

  findAll(findAllCardInstances: FindAllCardInstancesType) {
    return this.cardInstancesRepository.findAll(findAllCardInstances);
  }

  async attachOwnershipFlag(cards: CardType[], userId: string) {
    const cardsId = cards.map((card) => card.id);
    const cardInstances = await this.cardInstancesRepository.findAll({
      userId,
      cardsId,
    });

    return cards.map((card) => ({
      ...card,
      isOwned: cardInstances.some(
        (cardInstance) => cardInstance.card_id === card.id,
      ),
    }));
  }
}
