import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { AuctionsRepository } from './auctions.repository';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CreateAuctionServiceType } from './types/create-auction-service.type';
import { AuctionsFinishedEvent } from './events/auction-finished.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FindAllAuctionsServiceType } from './types/find-all-auctions-service.type';

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

  private findHighestBid(bids: { user_id: string; bid_amount: number }[]) {
    return bids.reduce(
      (maxBid, currentBid) =>
        currentBid.bid_amount > maxBid.bid_amount ? currentBid : maxBid,
      bids[0],
    );
  }

  async findAll(findAllAuctionsData: FindAllAuctionsServiceType) {
    const auctions = await this.auctionRepository.findAll(findAllAuctionsData);
    return auctions.map(({ bids, ...restAuctionData }) => {
      const highestBid = this.findHighestBid(bids);
      return {
        ...restAuctionData,
        highestBid: {
          amount: highestBid.bid_amount,
          isThisUserBid: highestBid.user_id === findAllAuctionsData.userId,
        },
      };
    });
  }

  async findOne(id: string, userId: string) {
    const { bids, card_instance, ...restAuctionData } =
      await this.auctionRepository.findOne(id);

    const highestBid = this.findHighestBid(bids);
    return {
      ...restAuctionData,
      card: {
        ...card_instance.cards,
      },
      highestBid: {
        amount: highestBid.bid_amount,
        isThisUserBid: highestBid.user_id === userId,
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
    await this.auctionRepository.update(id, { isCompleted: true });
    this.eventEmitter.emit(
      'auction.finished',
      new AuctionsFinishedEvent({ id }),
    );
  }
}
