import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { AuctionsRepository } from './auctions.repository';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CreateAuctionServiceType } from './types/create-auction-service.type';
import { AuctionsFinishedEvent } from './events/auction-finished.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FindAllAuctionsType } from './types/find-all-auctions.type';

@Injectable()
export class AuctionsService {
  constructor(
    private auctionRepository: AuctionsRepository,
    private cardInstancesService: CardInstancesService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createAuctionDto: CreateAuctionServiceType) {
    if (createAuctionDto.role === 'Admin') {
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
    const { bids, card_instance, ...restAuctionData } =
      await this.auctionRepository.findOne(id);

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
    await this.auctionRepository.findOne(id);
    return this.auctionRepository.update(id, updateAuctionDto);
  }

  async remove(id: string) {
    await this.auctionRepository.findOne(id);
    return this.auctionRepository.remove(id);
  }

  async finishAuction(id: string) {
    const { bids, card_instance_id } = await this.auctionRepository.update(id, {
      isCompleted: true,
    });
    const highestBid = bids[0];
    this.eventEmitter.emit(
      'auction.finished',
      new AuctionsFinishedEvent({
        id,
        cardInstanceId: card_instance_id,
        winnerId: highestBid?.user_id,
      }),
    );
  }
}
