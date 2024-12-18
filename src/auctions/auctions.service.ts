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

@Injectable()
export class AuctionsService {
  constructor(
    private auctionRepository: AuctionsRepository,
    private cardInstancesService: CardInstancesService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createAuctionDto: CreateAuctionServiceType) {
    if (createAuctionDto.role === Role.Admin) {
      const { id: cardInstanceId } = await this.cardInstancesService.create({
        userId: createAuctionDto.createdBy,
        cardId: createAuctionDto.cardId,
      });
      return this.auctionRepository.create({
        ...createAuctionDto,
        cardInstanceId,
      });
    }

    const cardInstance = await this.cardInstancesService
      .findAll({
        userId: createAuctionDto.createdBy,
        cardsId: [createAuctionDto.cardId],
      })
      .then((cardInstances) => cardInstances.pop());

    if (!cardInstance) {
      throw new BadRequestException("You don't have this card");
    }

    return this.auctionRepository.create({
      ...createAuctionDto,
      cardInstanceId: cardInstance.id,
    });
  }

  async findAll(findAllAuctionsData: FindAllAuctionsType) {
    const { auctions, totalCount } =
      await this.auctionRepository.findAll(findAllAuctionsData);
    return {
      data: auctions,
      info: {
        page: findAllAuctionsData.page,
        totalCount,
        totalPages: Math.ceil(totalCount / findAllAuctionsData.take),
      },
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
        event.createdAt.getTime() + min_length * 1000,
      );
      await this.update(event.auctionId, {
        endTime: newEndTime,
      });
    }
  }
}
