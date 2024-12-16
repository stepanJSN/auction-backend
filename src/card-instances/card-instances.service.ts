import { Injectable } from '@nestjs/common';
import { CardInstancesRepository } from './card-instances.repository';
import { FindAllCardInstancesType } from './types/find-all-card-instances.type';
import { CreateCardInstanceType } from './types/create-card-instance.type';
import type { cards as CardType } from '@prisma/client';
import { AuctionsFinishedEvent } from 'src/auctions/events/auction-finished.event';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class CardInstancesService {
  constructor(private cardInstancesRepository: CardInstancesRepository) {}

  create(cardInstanceData: CreateCardInstanceType) {
    return this.cardInstancesRepository.create(cardInstanceData);
  }

  findOne(cardInstanceId: string) {
    return this.cardInstancesRepository.findOne(cardInstanceId);
  }

  findAll(findAllCardInstances: FindAllCardInstancesType) {
    return this.cardInstancesRepository.findAll(findAllCardInstances);
  }

  @OnEvent('auction.finished')
  async updateCardOwner(event: AuctionsFinishedEvent) {
    if (!event.winnerId) return;
    await this.cardInstancesRepository.update(event.cardInstanceId, {
      userId: event.winnerId,
    });
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
