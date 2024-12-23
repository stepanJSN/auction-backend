import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuctionRepositoryType } from './types/create-auction-repository.type';
import { UpdateAuctionRepositoryType } from './types/update-auction-repository.type';
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
        end_time: createAuctionDto.endTime,
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
    createdById,
    participantId,
    isUserLeader,
    isCompleted,
    cardId,
    page = 1,
    take = 20,
  }: FindAllAuctionsType) {
    const sortColumn = {
      creationDate: 'a.created_at',
      finishDate: 'a.end_time',
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
        a.end_time,
        a.created_at,
        a.created_by_id,
        a.is_completed,
        c.name,
        c.image_url,
        b_highest.bid_amount AS highest_bid,
        b_highest.user_id AS highest_bid_user
      FROM 
        auctions a
      JOIN 
        card_instances ci ON ci.id = a.card_instance_id
      JOIN cards c ON c.id = ci.card_id
      LEFT JOIN 
        (
          SELECT 
            b.auction_id,
            b.bid_amount,
            b.user_id
          FROM 
            bids b
          JOIN 
            (
              SELECT 
                auction_id, 
                MAX(bid_amount) AS max_bid
              FROM 
                bids
              GROUP BY 
                auction_id
            ) b_max ON b.auction_id = b_max.auction_id AND b.bid_amount = b_max.max_bid
        ) b_highest ON b_highest.auction_id = a.id
      WHERE 
        (${isCompleted === false ? `a.is_completed = 0` : '1'})
        AND (${createdById ? `a.created_by_id = '${createdById}'` : '1'})
        AND (${locationId ? `c.location_id = ${locationId}` : '1'})
        AND (${cardName ? `c.name LIKE '%${cardName}%'` : '1'})
        AND (${cardId ? `c.id = '${cardId}'` : '1'})
        AND (${fromPrice ? `b.bid_amount >= ${fromPrice}` : '1'})
        AND (${toPrice ? `b.bid_amount <= ${toPrice}` : '1'})
        AND (${
          participantId && !isUserLeader
            ? `EXISTS (
          SELECT 1 
          FROM bids b 
          WHERE b.auction_id = a.id AND b.user_id = '${participantId}'
        )`
            : '1'
        })
        AND (${participantId && isUserLeader ? `b_highest.user_id = '${participantId}'` : '1'})
      GROUP BY 
        a.id, b_highest.bid_amount, b_highest.user_id
      ORDER BY
        ${sortColumn} ${sortDirection}
      LIMIT ${take} OFFSET ${(page - 1) * take};
    `,
    )) as unknown as AuctionsPrismaType[];

    const totalCount = (
      await this.prisma.$queryRawUnsafe(
        `
        SELECT 
          COUNT(*) AS total
        FROM 
          auctions a
        JOIN 
          card_instances ci ON ci.id = a.card_instance_id
        JOIN 
          cards c ON c.id = ci.card_id
        LEFT JOIN 
          (
            SELECT 
              b.auction_id,
              b.bid_amount,
              b.user_id
            FROM 
              bids b
            JOIN 
              (
                SELECT 
                  auction_id, 
                  MAX(bid_amount) AS max_bid
                FROM 
                  bids
                GROUP BY 
                  auction_id
              ) b_max ON b.auction_id = b_max.auction_id AND b.bid_amount = b_max.max_bid
          ) b_highest ON b_highest.auction_id = a.id
        WHERE 
          (${isCompleted === false ? `a.is_completed = 0` : '1'})
          AND (${createdById ? `a.created_by_id = '${createdById}'` : '1'})
          AND (${locationId ? `c.location_id = ${locationId}` : '1'})
          AND (${cardName ? `c.name LIKE '%${cardName}%'` : '1'})
          AND (${cardId ? `c.id = '${cardId}'` : '1'})
          AND (${fromPrice ? `b_highest.bid_amount >= ${fromPrice}` : '1'})
          AND (${toPrice ? `b_highest.bid_amount <= ${toPrice}` : '1'})
          AND (${
            participantId && !isUserLeader
              ? `EXISTS (
                SELECT 1 
                FROM bids b 
                WHERE b.auction_id = a.id AND b.user_id = '${participantId}'
              )`
              : '1'
          })
          AND (${participantId && isUserLeader ? `b_highest.user_id = '${participantId}'` : '1'});
      `,
      )
    )[0].total as number;
    return { auctions, totalCount: Number(totalCount) };
  }

  findFinishedByNow() {
    const now = new Date();
    return this.prisma.auctions.findMany({
      where: {
        is_completed: false,
        end_time: { lte: now },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.auctions.findUnique({
      where: { id },
      select: {
        starting_bid: true,
        min_bid_step: true,
        max_bid: true,
        min_length: true,
        end_time: true,
        is_completed: true,
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
  }

  async update(id: string, updateAuctionDto: UpdateAuctionRepositoryType) {
    try {
      return await this.prisma.auctions.update({
        where: { id },
        data: {
          starting_bid: updateAuctionDto.startingBid,
          min_bid_step: updateAuctionDto.minBidStep,
          max_bid: updateAuctionDto.maxBid,
          min_length: updateAuctionDto.minLength,
          end_time: updateAuctionDto.endTime,
          is_completed: updateAuctionDto.isCompleted,
        },
        select: {
          card_instance_id: true,
          created_by_id: true,
          bids: {
            select: {
              user_id: true,
              bid_amount: true,
            },
          },
        },
      });
    } catch {
      throw new NotFoundException('Auction not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.auctions.delete({ where: { id } });
    } catch {}
  }
}
