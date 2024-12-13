import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuctionRepositoryType } from './types/create-auction-repository.type';
import { UpdateAuctionRepositoryType } from './types/update-auction-repositroy.type';
import { FindAllAuctionsType } from './types/find-all-auctions.type';
import { AuctionsPrismaType } from './types/auctions-prisma.type';

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

  async findAll({
    locationId,
    cardName,
    fromPrice,
    toPrice,
    sortBy = 'creationDate',
    sortOrder,
    userId,
    isCompleted,
    page = 1,
    take = 20,
  }: FindAllAuctionsType) {
    const sortColumn = {
      creationDate: 'a.created_at',
      finishDate: 'a.max_length',
      highestBid: 'highest_bid',
    }[sortBy];
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const auctions = (await this.prisma.$queryRawUnsafe(
      `
      SELECT 
        a.id,
        a.starting_bid,
        a.min_bid_step,
        a.max_bid,
        a.max_length,
        a.created_at,
        a.created_by_id,
        a.is_completed,
        c.name,
        c.image_url,
        MAX(b.bid_amount) AS highest_bid
      FROM 
        auctions a
      JOIN 
        card_instances ci ON ci.id = a.card_instance_id
      JOIN cards c ON c.id = ci.card_id
      LEFT JOIN bids b ON b.auction_id = a.id
      WHERE 
        (${isCompleted === false ? `a.is_completed = 0` : '1'})
        AND (${userId ? `a.created_by_id = '${userId}'` : '1'})
        AND (${locationId ? `c.location_id = ${locationId}` : '1'})
        AND (${cardName ? `c.name LIKE '%${cardName}%'` : '1'})
        AND (${fromPrice ? `b.bid_amount >= ${fromPrice}` : '1'})
        AND (${toPrice ? `b.bid_amount <= ${toPrice}` : '1'})
      GROUP BY 
        a.id
      ORDER BY
        ${sortColumn} ${sortDirection}
      LIMIT ${take} OFFSET ${(page - 1) * take};
    `,
    )) as unknown as Promise<AuctionsPrismaType[]>;

    const totalCount = await this.prisma.auctions.count({
      where: {
        card_instance: {
          cards: {
            location_id: locationId,
            name: cardName,
          },
        },
        bids: {
          every: {
            bid_amount: {
              gte: fromPrice || 0,
              lte: toPrice,
            },
          },
        },
        is_completed: isCompleted,
      },
    });
    return { auctions, totalCount };
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
          orderBy: {
            bid_amount: 'desc',
          },
          take: 1,
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
