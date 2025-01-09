import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { AuctionsRepository } from './auctions.repository';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CreateAuctionServiceType } from './types/create-auction-service.type';
import { AuctionsFinishedEvent } from './events/auction-finished.event';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { FindAllAuctionsType } from './types/find-all-auctions.type';
import { NewBidEvent } from 'src/bids/events/new-bid.event';
import { AuctionChangedEvent } from './events/auction-changed.event';
import { Role } from '@prisma/client';
import {
  RatingAction,
  UpdateRatingEvent,
} from 'src/users/events/update-rating.event';
import { AuctionEvent } from './enums/auction-event.enum';
import { BidEvent } from 'src/bids/enums/bid-event.enum';
import { RatingEvent } from 'src/users/enums/rating-event.enum';
import { AuctionsGateway } from './auctions.gateway';
import { CardsService } from 'src/cards/cards.service';

@Injectable()
export class AuctionsService {
  constructor(
    private auctionRepository: AuctionsRepository,
    private cardInstancesService: CardInstancesService,
    private eventEmitter: EventEmitter2,
    private auctionsGateway: AuctionsGateway,
    private cardsService: CardsService,
  ) {}

  async create(createAuctionDto: CreateAuctionServiceType) {
    const isCardActive = await this.cardsService.isCardActive(
      createAuctionDto.cardId,
    );
    if (!isCardActive) {
      throw new BadRequestException('Card is not active');
    }

    const cardInstance = await this.cardInstancesService
      .findAll({
        userId: createAuctionDto.createdBy,
        cardsId: [createAuctionDto.cardId],
      })
      .then((cardInstances) => cardInstances.pop());

    if (createAuctionDto.role === Role.Admin && !cardInstance) {
      const { id: cardInstanceId } = await this.cardInstancesService.create({
        userId: createAuctionDto.createdBy,
        cardId: createAuctionDto.cardId,
      });
      return this.auctionRepository.create({
        ...createAuctionDto,
        cardInstanceId,
      });
    }

    if (!cardInstance) {
      throw new BadRequestException("You don't have this card");
    }

    return this.auctionRepository.create({
      ...createAuctionDto,
      cardInstanceId: cardInstance.id,
    });
  }

  async findAll({
    page = 1,
    take = 20,
    isUserTakePart,
    isUserLeader,
    participantId,
    ...findAllAuctionsData
  }: FindAllAuctionsType) {
    const { auctions, totalCount } = await this.auctionRepository.findAll({
      ...findAllAuctionsData,
      page,
      take,
      isUserLeader,
      isUserTakePart,
      participantId: isUserTakePart || isUserLeader ? participantId : undefined,
    });
    return {
      data: auctions.map(({ highest_bid_user, ...restAuctionsData }) => ({
        ...restAuctionsData,
        is_user_leader: highest_bid_user === participantId,
      })),
      info: {
        page,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    };
  }

  async getHighestBidRange() {
    const auctionWithHighestBid = await this.auctionRepository.findAll({
      sortOrder: 'desc',
      sortBy: 'highestBid',
      take: 1,
    });

    const auctionWithLowestBid = await this.auctionRepository.findAll({
      sortOrder: 'asc',
      sortBy: 'highestBid',
      take: 1,
    });

    return {
      min: auctionWithLowestBid.auctions[0].highest_bid ?? 0,
      max: auctionWithHighestBid.auctions[0].highest_bid ?? 0,
    };
  }

  async findOne(id: string, userId: string) {
    const auction = await this.auctionRepository.findOne(id);

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }
    const { bids, card_instance, ...restAuctionData } = auction;

    const highestBid = bids[0];

    const isUserHasThisCard = await this.cardInstancesService
      .findAll({
        userId,
        cardsId: [card_instance.cards.id],
      })
      .then((cardInstances) => !!cardInstances.pop());

    return {
      ...restAuctionData,
      card: {
        isUserHasThisCard,
        ...card_instance.cards,
      },
      highestBid: {
        amount: highestBid?.bid_amount,
        isThisUserBid: highestBid && highestBid.user_id === userId,
      },
    };
  }

  async update(id: string, updateAuctionDto: UpdateAuctionDto) {
    const auction = await this.auctionRepository.update(id, updateAuctionDto);
    this.eventEmitter.emit(
      AuctionEvent.CHANGED,
      new AuctionChangedEvent({
        id: id,
        ...updateAuctionDto,
      }),
    );
    return auction;
  }

  async remove(id: string) {
    const auction = await this.auctionRepository.findOne(id);
    if (auction.is_completed) {
      throw new ForbiddenException(
        'You cannot delete an auction that has already ended!',
      );
    }
    await this.auctionRepository.remove(id);
    return auction;
  }

  async finishAuction(id: string) {
    const { bids, card_instance_id, created_by_id } =
      await this.auctionRepository.update(id, {
        isCompleted: true,
      });
    const highestBid = bids[0];
    if (!highestBid) return;

    this.eventEmitter.emit(
      AuctionEvent.FINISHED,
      new AuctionsFinishedEvent({
        id,
        cardInstanceId: card_instance_id,
        winnerId: highestBid.user_id,
        sellerId: created_by_id,
        highestBid: highestBid.bid_amount,
      }),
    );

    this.eventEmitter.emit(
      RatingEvent.UPDATE,
      new UpdateRatingEvent({
        userId: created_by_id,
        pointsAmount: 1,
        action: RatingAction.DECREASE,
      }),
    );

    this.eventEmitter.emit(
      RatingEvent.UPDATE,
      new UpdateRatingEvent({
        userId: highestBid.user_id,
        pointsAmount: 1,
        action: RatingAction.INCREASE,
      }),
    );
  }

  @OnEvent(BidEvent.NEW)
  async extendAuctionIfNecessary(event: NewBidEvent) {
    const { end_time, min_length } = await this.auctionRepository.findOne(
      event.auctionId,
    );

    const diffInMilliseconds = end_time.getTime() - event.createdAt.getTime();
    const diffInMinutes = Math.ceil(diffInMilliseconds / 1000 / 60);

    if (diffInMinutes < min_length) {
      const newEndTime = new Date(
        event.createdAt.getTime() + min_length * 60 * 1000,
      );
      await this.update(event.auctionId, {
        endTime: newEndTime,
      });
    }
  }
}
