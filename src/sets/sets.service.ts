import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSetDto } from './dto/create-set.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { SetsRepository } from './sets.repository';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { FindAllSetsServiceType } from './types/find-all-sets-service.type';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AuctionsFinishedEvent } from 'src/auctions/events/auction-finished.event';
import { Role } from '@prisma/client';
import {
  UpdateRatingEvent,
  RatingAction,
} from 'src/users/events/update-rating.event';
import { FindAllUsersWithSetType } from './types/find-all-users-with-set.type';

const SETS_PER_ITERATION = 30;

@Injectable()
export class SetsService {
  constructor(
    private setsRepository: SetsRepository,
    private cardInstancesService: CardInstancesService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createSetDto: CreateSetDto) {
    const { id, cards, bonus } = await this.setsRepository.create(createSetDto);
    await this.findAllUsersWithCardsId({
      cards,
      forEachUserWithSet: (userId) => {
        this.eventEmitter.emit(
          'rating.update',
          new UpdateRatingEvent({
            userId,
            pointsAmount: bonus,
            action: RatingAction.INCREASE,
          }),
        );
      },
    });
    return id;
  }

  async findAll({ page = 1, take = 10, role, userId }: FindAllSetsServiceType) {
    const { sets, totalCount } = await this.setsRepository.findAll(page, take);
    const info = {
      page,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
    };
    if (role !== Role.User) {
      return { data: sets, info };
    }

    const mappedSets = await Promise.all(
      sets.map(async (set) => ({
        id: set.id,
        name: set.name,
        bonus: set.bonus,
        cards: await this.cardInstancesService.attachOwnershipFlag(
          set.cards,
          userId,
        ),
        createdAt: set.created_at,
      })),
    );
    return {
      data: mappedSets,
      info: {
        page,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    };
  }

  findAllWithCard(cardId: string, page: number, take: number) {
    return this.setsRepository.findAllWithCard(cardId, page, take);
  }

  async findOne(id: string) {
    const set = await this.setsRepository.findOne(id);
    if (!set) {
      throw new NotFoundException('Set not found');
    }
    return set;
  }

  @OnEvent('auction.finished')
  async checkUserCollectedSets({
    cardInstanceId,
    winnerId: userId,
  }: AuctionsFinishedEvent) {
    const { card_id } = await this.cardInstancesService.findOne(cardInstanceId);

    let currentPage = 1;
    while (true) {
      const { sets, totalCount } = await this.findAllWithCard(
        card_id,
        currentPage,
        SETS_PER_ITERATION,
      );
      await Promise.all(
        sets.map(async (set) => {
          const cardInstances = await this.cardInstancesService.findAll({
            cardsId: set.cards
              .filter((card) => card.id !== card_id)
              .map((card) => card.id),
            userId,
          });
          if (cardInstances.length === set.cards.length - 1) {
            this.eventEmitter.emit(
              'rating.update',
              new UpdateRatingEvent({
                userId: userId,
                pointsAmount: set.bonus,
                action: RatingAction.INCREASE,
              }),
            );
          }
        }),
      );

      const totalPages = Math.ceil(totalCount / SETS_PER_ITERATION);
      if (currentPage >= totalPages) break;
      currentPage++;
    }
  }

  async findAllUsersWithCardsId({
    cards,
    forEachUserWithSet,
  }: FindAllUsersWithSetType) {
    const cardInstances = await this.cardInstancesService.findAll({
      cardsId: cards.map((card) => card.id),
    });

    cardInstances.reduce((users, cardInstance) => {
      users[cardInstance.user_id] = (users[cardInstance.user_id] || 0) + 1;
      if (users[cardInstance.user_id] === cards.length) {
        forEachUserWithSet(cardInstance.user_id);
      }
      return users;
    }, {});
  }

  async update(id: string, updateSetDto: UpdateSetDto) {
    if (updateSetDto.bonus) {
      const { cards, bonus } = await this.findOne(id);
      const newBonus = updateSetDto.bonus - bonus;
      await this.findAllUsersWithCardsId({
        cards,
        forEachUserWithSet: (userId) => {
          this.eventEmitter.emit(
            'rating.update',
            new UpdateRatingEvent({
              userId,
              pointsAmount: Math.abs(newBonus),
              action:
                newBonus > 0 ? RatingAction.INCREASE : RatingAction.DECREASE,
            }),
          );
        },
      });
    }

    return this.setsRepository.update(id, updateSetDto);
  }

  async remove(id: string) {
    const { cards, bonus } = await this.setsRepository.remove(id);

    await this.findAllUsersWithCardsId({
      cards,
      forEachUserWithSet: (userId) => {
        this.eventEmitter.emit(
          'rating.update',
          new UpdateRatingEvent({
            userId,
            pointsAmount: bonus,
            action: RatingAction.DECREASE,
          }),
        );
      },
    });
  }
}
