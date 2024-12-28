import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { SetEventPayload } from './events/set.event';
import { AuctionEvent } from 'src/auctions/enums/auction-event.enum';
import { RatingEvent } from 'src/users/enums/rating-event.enum';
import { SetEvent } from './enums/set-event.enum';
import { UserSetType } from './types/user-sets.type';
import { CardsService } from 'src/cards/cards.service';

const SETS_PER_ITERATION = 30;

@Injectable()
export class SetsService {
  constructor(
    private setsRepository: SetsRepository,
    private cardInstancesService: CardInstancesService,
    private eventEmitter: EventEmitter2,
    private cardsService: CardsService,
  ) {}

  async create(createSetDto: CreateSetDto) {
    await Promise.all(
      createSetDto.cardsId.map(async (cardId) => {
        const isCardActive = await this.cardsService.isCardActive(cardId);
        if (!isCardActive) {
          throw new BadRequestException(
            'One of the cards in the set is inactive',
          );
        }
      }),
    );

    const { id, cards, bonus } = await this.setsRepository.create(createSetDto);

    this.eventEmitter.emit(
      SetEvent.CREATE,
      new SetEventPayload({
        cardsId: cards.map((card) => card.id),
        bonus,
      }),
    );

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
      sets.map(async (set) => {
        const cardsWithOwnershipFlag =
          await this.cardInstancesService.attachOwnershipFlag(
            set.cards,
            userId,
          );
        return {
          id: set.id,
          name: set.name,
          bonus: set.bonus,
          cards: cardsWithOwnershipFlag,
          is_user_has_set: cardsWithOwnershipFlag.every(
            (card) => card.is_owned,
          ),
          created_at: set.created_at,
        };
      }),
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

  @OnEvent(AuctionEvent.FINISHED)
  async checkUserCollectedSets({
    cardInstanceId,
    winnerId,
    sellerId,
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
          await this.checkWinnerCards(set, winnerId, card_id);
          await this.checkSellerCards(set, sellerId, card_id);
        }),
      );

      const totalPages = Math.ceil(totalCount / SETS_PER_ITERATION);
      if (currentPage >= totalPages) break;
      currentPage++;
    }
  }

  private async checkWinnerCards(
    set: UserSetType,
    winnerId: string,
    card_id: string,
  ) {
    const winnerCardInstances = await this.cardInstancesService.findAll({
      cardsId: set.cards
        .filter((card) => card.id !== card_id)
        .map((card) => card.id),
      userId: winnerId,
    });
    if (winnerCardInstances.length === set.cards.length - 1) {
      this.eventEmitter.emit(
        RatingEvent.UPDATE,
        new UpdateRatingEvent({
          userId: winnerId,
          pointsAmount: set.bonus,
          action: RatingAction.INCREASE,
        }),
      );
    }
  }

  private async checkSellerCards(
    set: UserSetType,
    sellerId: string,
    card_id: string,
  ) {
    const sellerCardInstances = await this.cardInstancesService.findAll({
      cardsId: set.cards
        .filter((card) => card.id !== card_id)
        .map((card) => card.id),
      userId: sellerId,
    });

    if (sellerCardInstances.length === set.cards.length - 1) {
      this.eventEmitter.emit(
        RatingEvent.UPDATE,
        new UpdateRatingEvent({
          userId: sellerId,
          pointsAmount: set.bonus,
          action: RatingAction.DECREASE,
        }),
      );
    }
  }

  async update(id: string, updateSetDto: UpdateSetDto) {
    if (updateSetDto.bonus) {
      const { cards, bonus } = await this.findOne(id);
      const newBonus = updateSetDto.bonus - bonus;

      this.eventEmitter.emit(
        SetEvent.UPDATE,
        new SetEventPayload({
          cardsId: cards.map((card) => card.id),
          bonus: newBonus,
        }),
      );
    }

    return this.setsRepository.update(id, updateSetDto);
  }

  async remove(id: string) {
    const { cards, bonus } = await this.setsRepository.remove(id);

    this.eventEmitter.emit(
      SetEvent.REMOVE,
      new SetEventPayload({
        cardsId: cards.map((card) => card.id),
        bonus,
      }),
    );
  }
}
