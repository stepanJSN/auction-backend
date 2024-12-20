import { Injectable } from '@nestjs/common';
import { CardInstancesRepository } from './card-instances.repository';
import { FindAllCardInstancesType } from './types/find-all-card-instances.type';
import { CreateCardInstanceType } from './types/create-card-instance.type';
import type { cards as CardType } from '@prisma/client';
import { AuctionsFinishedEvent } from 'src/auctions/events/auction-finished.event';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { SetEventPayload } from 'src/sets/events/set.event';
import { FindAllUsersWithSetType } from './types/find-all-users-with-set.type';
import {
  RatingAction,
  UpdateRatingEvent,
} from 'src/users/events/update-rating.event';
import { AuctionEvent } from 'src/auctions/enums/auction-event.enum';
import { RatingEvent } from 'src/users/enums/rating-event.enum';
import { SetEvent } from 'src/sets/enums/set-event.enum';
import { GroupCardByParamType } from './types/group-card-by-param.type';

@Injectable()
export class CardInstancesService {
  constructor(
    private cardInstancesRepository: CardInstancesRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  create(cardInstanceData: CreateCardInstanceType) {
    return this.cardInstancesRepository.create(cardInstanceData);
  }

  findOne(cardInstanceId: string) {
    return this.cardInstancesRepository.findOne(cardInstanceId);
  }

  findAll(findAllCardInstances: FindAllCardInstancesType) {
    return this.cardInstancesRepository.findAll(findAllCardInstances);
  }

  countAllByCardId(cardId: string) {
    return this.cardInstancesRepository.count(cardId);
  }

  groupCardByParam(groupCardByParam: GroupCardByParamType) {
    return this.cardInstancesRepository.groupCardByParam(groupCardByParam);
  }

  @OnEvent(AuctionEvent.FINISHED)
  async updateCardOwner(event: AuctionsFinishedEvent) {
    await this.cardInstancesRepository.update(event.cardInstanceId, {
      userId: event.winnerId,
    });
  }

  @OnEvent(SetEvent.CREATE)
  async handleSetCreate({ cardsId, bonus }: SetEventPayload) {
    await this.findAllUsersWithCardsId({
      cardsId,
      forEachUserWithSet: (userId) => {
        this.eventEmitter.emit(
          RatingEvent.UPDATE,
          new UpdateRatingEvent({
            userId,
            pointsAmount: bonus,
            action: RatingAction.INCREASE,
          }),
        );
      },
    });
  }

  @OnEvent(SetEvent.REMOVE)
  async handleSetRemove({ cardsId, bonus }: SetEventPayload) {
    await this.findAllUsersWithCardsId({
      cardsId,
      forEachUserWithSet: (userId) => {
        this.eventEmitter.emit(
          RatingEvent.UPDATE,
          new UpdateRatingEvent({
            userId,
            pointsAmount: bonus,
            action: RatingAction.DECREASE,
          }),
        );
      },
    });
  }

  @OnEvent(SetEvent.UPDATE)
  async handleSetUpdate({ cardsId, bonus }: SetEventPayload) {
    await this.findAllUsersWithCardsId({
      cardsId,
      forEachUserWithSet: (userId) => {
        this.eventEmitter.emit(
          RatingEvent.UPDATE,
          new UpdateRatingEvent({
            userId,
            pointsAmount: Math.abs(bonus),
            action: bonus > 0 ? RatingAction.INCREASE : RatingAction.DECREASE,
          }),
        );
      },
    });
  }

  async findAllUsersWithCardsId({
    cardsId,
    forEachUserWithSet,
  }: FindAllUsersWithSetType) {
    const cardInstances = await this.findAll({
      cardsId,
    });

    cardInstances.reduce((users, cardInstance) => {
      users[cardInstance.user_id] = (users[cardInstance.user_id] || 0) + 1;
      if (users[cardInstance.user_id] === cardsId.length) {
        forEachUserWithSet(cardInstance.user_id);
      }
      return users;
    }, {});
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
