import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllAuctionsDto } from './dto/find-all-auction.dto';
import { CreateAuctionRepositoryType } from './types/create-auction-repository.type';
import { UpdateAuctionRepositoryType } from './types/update-auction-repositroy.type';

@Injectable()
export class AuctionsRepository {
  constructor(private prisma: PrismaService) {}

  async create(createAuctionDto: CreateAuctionRepositoryType) {
    const { id } = await this.prisma.auctions.create({
      data: {
        starting_bid: createAuctionDto.startingBid,
        min_bid_step: createAuctionDto.minBidStep,
        max_bid: createAuctionDto.maxBid,
        min_length: createAuctionDto.minLength,
        max_length: createAuctionDto.maxLength,
        created_by: {
          connect: { id: createAuctionDto.createdBy },
        },
        card_instance: {
          connect: { id: createAuctionDto.cardInstanceId },
        },
      },
    });

    return id;
  }

  async findAll(findAllAuctionsDto: FindAllAuctionsDto) {
    const auctions = await this.prisma.auctions.findMany({
      where: {
        card_instance: {
          cards: {
            location_id: findAllAuctionsDto.locationId,
            name: findAllAuctionsDto.cardName,
          },
        },
        bids: {
          every: {
            bid_amount: {
              gte: findAllAuctionsDto.fromPrice || 0,
              lte: findAllAuctionsDto.toPrice || Number.MAX_VALUE,
            },
          },
        },
      },
      select: {
        starting_bid: true,
        min_bid_step: true,
        max_bid: true,
        max_length: true,
        created_by: {
          select: {
            id: true,
          },
        },
        card_instance: {
          select: {
            cards: true,
          },
        },
        bids: {
          select: {
            user_id: true,
            bid_amount: true,
          },
        },
      },
    });
    return auctions.sort((a, b) => {
      const highestBidA = Math.max(...a.bids.map((bid) => +bid.bid_amount));
      const highestBidB = Math.max(...b.bids.map((bid) => +bid.bid_amount));

      return findAllAuctionsDto.sortOrder === 'asc'
        ? highestBidA - highestBidB
        : highestBidB - highestBidA;
    });
  }

  findFinishedByNow() {
    const now = new Date();
    return this.prisma.auctions.findMany({
      where: {
        is_completed: false,
        max_length: { lte: now },
      },
    });
  }

  async findOne(id: string) {
    const auction = await this.prisma.auctions.findUnique({
      where: { id },
      select: {
        starting_bid: true,
        min_bid_step: true,
        max_bid: true,
        min_length: true,
        max_length: true,
        created_by: {
          select: {
            id: true,
          },
        },
        card_instance: {
          select: {
            user_id: true,
            cards: true,
          },
        },
        bids: {
          select: {
            user_id: true,
            bid_amount: true,
          },
        },
      },
    });
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }
    return auction;
  }

  update(id: string, updateAuctionDto: UpdateAuctionRepositoryType) {
    return this.prisma.auctions.update({
      where: { id },
      data: {
        starting_bid: updateAuctionDto.startingBid,
        min_bid_step: updateAuctionDto.minBidStep,
        max_bid: updateAuctionDto.maxBid,
        min_length: updateAuctionDto.minLength,
        max_length: updateAuctionDto.maxLength,
        is_completed: updateAuctionDto.isCompleted,
      },
      select: {
        card_instance_id: true,
        bids: {
          select: {
            user_id: true,
            bid_amount: true,
          },
        },
      },
    });
  }

  remove(id: string) {
    return this.prisma.auctions.delete({ where: { id } });
  }
}
