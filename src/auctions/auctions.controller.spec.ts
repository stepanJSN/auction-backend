import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import { MOCK_DATE, MOCK_EMAIL, MOCK_USER_ID } from 'config/mock-test-data';
import { Role } from '@prisma/client';

describe('AuctionsController', () => {
  let auctionsController: AuctionsController;
  let auctionsService: DeepMockProxy<AuctionsService>;
  const currentUserId = MOCK_USER_ID;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuctionsController],
      providers: [
        { provide: AuctionsService, useValue: mockDeep<AuctionsService>() },
      ],
    }).compile();

    auctionsController = module.get(AuctionsController);
    auctionsService = module.get(AuctionsService);
  });
  describe('create', () => {
    it('should create a new auction', async () => {
      const currentUserData = {
        id: MOCK_USER_ID,
        role: Role.User,
        email: MOCK_EMAIL,
      };
      const createAuctionDto = {
        cardId: 'cardId',
        startingBid: 100,
        minBidStep: 2,
        maxBid: 1000,
        minLength: 5,
        endTime: MOCK_DATE,
      };
      const mockCreatedAuctionId = 'auctionId';
      auctionsService.create.mockResolvedValue(mockCreatedAuctionId);

      const result = await auctionsController.create(
        currentUserData,
        createAuctionDto,
      );
      expect(result).toBe(mockCreatedAuctionId);
      expect(auctionsService.create).toHaveBeenCalledWith({
        ...createAuctionDto,
        createdBy: currentUserData.id,
        role: currentUserData.role,
      });
    });
  });

  const findAllAuctionsDto = {
    fromPrice: 100,
    toPrice: 1000,
    take: 20,
    page: 1,
  };
  const mockFindAllAuctions = {
    data: [],
    info: { page: 1, totalCount: 0, totalPages: 0 },
  };
  describe('findAll', () => {
    it('should return all auctions', async () => {
      auctionsService.findAll.mockResolvedValue(mockFindAllAuctions);
      const result = await auctionsController.findAll(
        currentUserId,
        findAllAuctionsDto,
      );
      expect(auctionsService.findAll).toHaveBeenCalledWith({
        ...findAllAuctionsDto,
        participantId: currentUserId,
        isCompleted: false,
      });
      expect(result).toEqual(mockFindAllAuctions);
    });
  });

  describe('findAllCreatedByUser', () => {
    it('should return all auctions created by the user', async () => {
      auctionsService.findAll.mockResolvedValue(mockFindAllAuctions);
      const result = await auctionsController.findAll(
        currentUserId,
        findAllAuctionsDto,
      );
      expect(auctionsService.findAll).toHaveBeenCalledWith({
        ...findAllAuctionsDto,
        createdById: currentUserId,
      });
      expect(result).toEqual(mockFindAllAuctions);
    });
  });

  describe('findAllWonByUser', () => {
    it('should return all auctions won by the user', async () => {
      auctionsService.findAll.mockResolvedValue(mockFindAllAuctions);
      const result = await auctionsController.findAll(
        currentUserId,
        findAllAuctionsDto,
      );
      expect(auctionsService.findAll).toHaveBeenCalledWith({
        ...findAllAuctionsDto,
        participantId: currentUserId,
        isCompleted: true,
        isUserLeader: true,
      });
      expect(result).toEqual(mockFindAllAuctions);
    });
  });

  describe('getHighestBidRange', () => {
    it('should return the highest bid range', async () => {
      const mockHighestBidRange = {
        min: 100,
        max: 200,
      };
      auctionsService.getHighestBidRange.mockResolvedValue(mockHighestBidRange);
      const result = await auctionsController.getHighestBidRange();
      expect(auctionsService.getHighestBidRange).toHaveBeenCalledWith();
      expect(result).toEqual(mockHighestBidRange);
    });
  });

  describe('findOne', () => {
    it('should find one auction', async () => {
      const auctionId = 'auctionId';
      const mockAuction = {
        id: auctionId,
      };
      auctionsService.findOne.mockResolvedValue(mockAuction as any);
      const result = await auctionsController.findOne(currentUserId, auctionId);
      expect(auctionsService.findOne).toHaveBeenCalledWith(
        auctionId,
        currentUserId,
      );
      expect(auctionsService.findOne).toHaveBeenCalledWith(auctionId);
      expect(result).toEqual(mockAuction);
    });
  });

  describe('update', () => {
    it('should update an auction', async () => {
      const auctionId = 'auctionId';
      const updateAuctionDto = {
        minLength: 20,
      };
      const mockAuction = {
        id: auctionId,
        ...updateAuctionDto,
      };
      const result = await auctionsController.update(
        auctionId,
        updateAuctionDto,
      );
      expect(auctionsService.update).toHaveBeenCalledWith(
        auctionId,
        updateAuctionDto,
      );
      expect(result).toEqual(mockAuction);
    });
  });

  describe('remove', () => {
    it('should remove an auction', async () => {
      const auctionId = 'auctionId';
      const mockAuction = {
        id: auctionId,
      };
      const result = await auctionsController.remove(auctionId);
      expect(auctionsService.remove).toHaveBeenCalledWith(auctionId);
      expect(result).toEqual(mockAuction);
    });
  });
});
