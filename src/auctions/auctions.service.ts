import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { AuctionsRepository } from './auctions.repository';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CreateAuctionServiceType } from './types/create-auction-service.type';
import { FindAllAuctionsDto } from './dto/find-all-auction.dto';

@Injectable()
export class AuctionsService {
  constructor(
    private auctionRepository: AuctionsRepository,
    private cardInstancesService: CardInstancesService,
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

  findAll(findAllAuctionsDto: FindAllAuctionsDto) {
    return this.auctionRepository.findAll(findAllAuctionsDto);
  }

  async findOne(id: string, userId: string) {
    const { bids, card_instance, ...restAuctionData } =
      await this.auctionRepository.findOne(id);
    const highestBid = bids.sort(
      (bidA, bidB) => +bidB.bid_amount - +bidA.bid_amount,
    )[0];
    return {
      ...restAuctionData,
      card: {
        ...card_instance.cards,
      },
      bid: {
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
}
