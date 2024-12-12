import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { FindAllAuctionsDto } from './dto/find-all-auction.dto';
import { CreateAuctionRepositoryType } from './types/create-auction-repository.type';

@Injectable()
export class AuctionsRepository {
  constructor(private prisma: PrismaService) {}

  async create(createAuctionDto: CreateAuctionRepositoryType) {
    const { id } = await this.prisma.auctions.create({
      data: {
        starting_bid: createAuctionDto.starting_bid,
        min_bid_step: createAuctionDto.min_bid_step,
        max_bid: createAuctionDto.max_bid,
        min_length: createAuctionDto.min_length,
        max_length: createAuctionDto.max_length,
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
      include: {
        bids: true,
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

  update(id: string, updateAuctionDto: UpdateAuctionDto) {
    return this.prisma.auctions.update({
      where: { id },
      data: {
        starting_bid: updateAuctionDto.starting_bid,
        min_bid_step: updateAuctionDto.min_bid_step,
        max_bid: updateAuctionDto.max_bid,
        min_length: updateAuctionDto.min_length,
        max_length: updateAuctionDto.max_length,
      },
    });
  }

  remove(id: string) {
    return this.prisma.auctions.delete({ where: { id } });
  }
}
