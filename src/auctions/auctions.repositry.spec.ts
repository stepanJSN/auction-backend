import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuctionsRepository } from './auctions.repository';
import { MOCK_DATE, MOCK_IMAGE_URL } from 'config/mock-test-data';
import { NotFoundException } from '@nestjs/common';
import { FindAllAuctionsType } from './types/find-all-auctions.type';

describe('AuctionsRepository', () => {
  let auctionsRepository: AuctionsRepository;
  let prisma: DeepMockProxy<PrismaService>;
  const mockAuction = {
    id: 'auctionId',
    card_instance_id: 'cardInstanceId',
    starting_bid: 100,
    min_bid_step: 2,
    max_bid: 1000,
    min_length: 5,
    end_time: MOCK_DATE,
    is_completed: false,
    created_by_id: 'creatorId',
    created_at: MOCK_DATE,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuctionsRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    auctionsRepository = module.get(AuctionsRepository);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new auction', async () => {
      const createAuctionDto = {
        startingBid: 100,
        minBidStep: 10,
        maxBid: 200,
        minLength: 5,
        endTime: MOCK_DATE,
        createdBy: 'creatorId',
        cardInstanceId: 'cardInstanceId',
      };
      const mockCreatedAuctionId = 'auctionId';

      prisma.auctions.create.mockResolvedValue({
        id: mockCreatedAuctionId,
      } as any);

      await expect(
        auctionsRepository.create(createAuctionDto),
      ).resolves.toEqual(mockCreatedAuctionId);
      expect(prisma.auctions.create).toHaveBeenCalledWith({
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
    });
  });

  describe('findAll', () => {
    it('should find all auctions', async () => {
      const findAllAuctionsDto: FindAllAuctionsType = {
        locationId: 10,
        cardName: 'cardName',
        fromPrice: 100,
        toPrice: 1000,
        sortBy: 'creationDate',
        sortOrder: 'asc',
        createdById: 'creatorId',
        participantId: 'participantId',
        isUserLeader: false,
        isCompleted: false,
        cardId: 'cardId',
        page: 1,
        take: 20,
      };
      const mockAuctionWithCardAndHighestBid = {
        ...mockAuction,
        name: findAllAuctionsDto.cardName,
        image_url: MOCK_IMAGE_URL,
        highest_bid: 500,
        highest_bid_user: 'participantId',
      };

      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        mockAuctionWithCardAndHighestBid,
      ]);
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        {
          total: 1,
        },
      ]);

      await expect(
        auctionsRepository.findAll(findAllAuctionsDto),
      ).resolves.toEqual({
        auctions: [mockAuctionWithCardAndHighestBid],
        totalCount: 1,
      });
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
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
        (a.is_completed = 0)
        AND (a.created_by_id = '${findAllAuctionsDto.createdById}')
        AND (c.location_id = ${findAllAuctionsDto.locationId})
        AND (c.name LIKE '%${findAllAuctionsDto.cardName}%')
        AND (c.id = '${findAllAuctionsDto.cardId}')
        AND (b_highest.bid_amount  >= ${findAllAuctionsDto.fromPrice} OR a.starting_bid >= ${findAllAuctionsDto.fromPrice})
        AND (b_highest.bid_amount  <= ${findAllAuctionsDto.toPrice} OR a.starting_bid <= ${findAllAuctionsDto.toPrice})
        AND (EXISTS (
          SELECT 1 
          FROM bids b 
          WHERE b.auction_id = a.id AND b.user_id = '${findAllAuctionsDto.participantId}'
        ))
        AND (1)
      GROUP BY 
        a.id, b_highest.bid_amount, b_highest.user_id
      ORDER BY
        a.created_at ASC
      LIMIT ${findAllAuctionsDto.take} OFFSET ${(findAllAuctionsDto.page - 1) * findAllAuctionsDto.take};
    `,
      );
    });
  });

  describe('finishedByNow', () => {
    it('should find finished auctions', async () => {
      prisma.auctions.findMany.mockResolvedValue([mockAuction]);
      const finishedAuctions = await auctionsRepository.findFinishedByNow();
      expect(finishedAuctions).toEqual([mockAuction]);
      expect(prisma.auctions.findMany).toHaveBeenCalledWith({
        where: {
          end_time: {
            lte: expect.any(Date),
          },
          is_completed: false,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should find auction by id', async () => {
      const auctionId = mockAuction.id;
      prisma.auctions.findUnique.mockResolvedValue(mockAuction);

      await expect(auctionsRepository.findOne(auctionId)).resolves.toEqual(
        mockAuction,
      );
      expect(prisma.auctions.findUnique).toHaveBeenCalledWith({
        where: { id: auctionId },
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
              cards: {
                include: {
                  location: true,
                  episodes: true,
                },
              },
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
    });
  });

  describe('update', () => {
    it('should update auction if it exists', async () => {
      const auctionId = mockAuction.id;
      const updateAuctionDto = {
        startingBid: 1000,
        minBidStep: 60,
        maxBid: 2000,
        minLength: 10,
        endTime: MOCK_DATE,
        isCompleted: false,
      };
      const mockUpdatedAuction = {
        card_instance_id: mockAuction.card_instance_id,
        created_by_id: mockAuction.created_by_id,
        bids: [
          {
            user_id: 'userId',
            bid_amount: 150,
          },
        ],
      };

      prisma.auctions.update.mockResolvedValue(mockUpdatedAuction as any);

      await expect(
        auctionsRepository.update(auctionId, updateAuctionDto),
      ).resolves.toEqual(mockUpdatedAuction);
      expect(prisma.auctions.update).toHaveBeenCalledWith({
        where: { id: auctionId },
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
    });

    it('should throw a NotFoundException if auction does not exist', async () => {
      const auctionId = mockAuction.id;
      const updateAuctionDto = {
        startingBid: 1000,
      };

      prisma.auctions.update.mockRejectedValueOnce(
        new Error('Prisma not found error'),
      );
      await expect(
        auctionsRepository.update(auctionId, updateAuctionDto),
      ).rejects.toThrow(new NotFoundException('Auction not found'));
    });
  });

  describe('remove', () => {
    it('should remove auction if it exists and return him', async () => {
      const auctionId = mockAuction.id;
      prisma.auctions.delete.mockResolvedValue(mockAuction);

      await expect(auctionsRepository.remove(auctionId)).resolves.toEqual(
        mockAuction,
      );
      expect(prisma.auctions.delete).toHaveBeenCalledWith({
        where: { id: auctionId },
      });
    });

    it('should return undefined if auction does not exist', async () => {
      const auctionId = 'non-existing-id';
      prisma.auctions.delete.mockRejectedValue(
        new Error('Prisma not found error'),
      );
      await expect(
        auctionsRepository.remove(auctionId),
      ).resolves.toBeUndefined();
      expect(prisma.auctions.delete).toHaveBeenCalledWith({
        where: { id: auctionId },
      });
    });
  });
});
