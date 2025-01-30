import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CardsService } from 'src/cards/cards.service';
import { AuctionsRepository } from './auctions.repository';
import { AuctionsService } from './auctions.service';
import { MOCK_CARD, MOCK_DATE } from 'config/mock-test-data';
import { Role } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuctionEvent } from './enums/auction-event.enum';
import { AuctionChangedEvent } from './events/auction-changed.event';
import { AuctionsFinishedEvent } from './events/auction-finished.event';
import { RatingEvent } from 'src/users/enums/rating-event.enum';
import {
  RatingAction,
  UpdateRatingEvent,
} from 'src/users/events/update-rating.event';

describe('AuctionsService', () => {
  let auctionsService: AuctionsService;
  let auctionRepository: DeepMockProxy<AuctionsRepository>;
  let cardInstancesService: DeepMockProxy<CardInstancesService>;
  let cardsService: DeepMockProxy<CardsService>;
  let eventEmitter: EventEmitter2;
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
      providers: [
        AuctionsService,
        {
          provide: AuctionsRepository,
          useValue: mockDeep<AuctionsRepository>(),
        },
        {
          provide: CardInstancesService,
          useValue: mockDeep<CardInstancesService>(),
        },
        {
          provide: CardsService,
          useValue: mockDeep<CardsService>(),
        },
        {
          provide: EventEmitter2,
          useValue: mockDeep<EventEmitter2>(),
        },
      ],
    }).compile();

    auctionsService = module.get(AuctionsService);
    auctionRepository = module.get(AuctionsRepository);
    cardInstancesService = module.get(CardInstancesService);
    cardsService = module.get(CardsService);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('create', () => {
    const createAuctionDto = {
      cardId: 'some-card-id',
      startingBid: 100,
      minBidStep: 5,
      maxBid: 500,
      minLength: 3,
      endTime: MOCK_DATE,
      createdBy: 'some-user-id',
      role: Role.Admin,
    };
    const mockCardInstance = {
      id: 'card-instance-id',
      created_at: MOCK_DATE,
      card_id: createAuctionDto.cardId,
      user_id: createAuctionDto.createdBy,
    };
    const mockAuctionId = 'some-auction-id';

    it('should create an auction and don`t create card instance if admin already has one', async () => {
      cardsService.isCardActive.mockResolvedValue(true);
      cardInstancesService.findAll.mockResolvedValue([mockCardInstance]);
      auctionRepository.create.mockResolvedValue(mockAuctionId);

      await expect(auctionsService.create(createAuctionDto)).resolves.toBe(
        mockAuctionId,
      );

      expect(cardsService.isCardActive).toHaveBeenCalledWith(
        createAuctionDto.cardId,
      );
      expect(cardInstancesService.findAll).toHaveBeenCalledWith({
        userId: createAuctionDto.createdBy,
        cardsId: [createAuctionDto.cardId],
      });
      expect(auctionRepository.create).toHaveBeenCalledWith({
        ...createAuctionDto,
        cardInstanceId: mockCardInstance.id,
      });
      expect(cardInstancesService.create).not.toHaveBeenCalled();
    });

    it('should create an auction and create card instance if users is admin and does not have one', async () => {
      cardsService.isCardActive.mockResolvedValue(true);
      cardInstancesService.findAll.mockResolvedValue([]);
      cardInstancesService.create.mockResolvedValue(mockCardInstance);
      auctionRepository.create.mockResolvedValue(mockAuctionId);

      await expect(auctionsService.create(createAuctionDto)).resolves.toBe(
        mockAuctionId,
      );
      expect(cardsService.isCardActive).toHaveBeenCalledWith(
        createAuctionDto.cardId,
      );
      expect(cardInstancesService.findAll).toHaveBeenCalledWith({
        userId: createAuctionDto.createdBy,
        cardsId: [createAuctionDto.cardId],
      });
      expect(auctionRepository.create).toHaveBeenCalledWith({
        ...createAuctionDto,
        cardInstanceId: mockCardInstance.id,
      });
      expect(cardInstancesService.create).toHaveBeenCalledWith({
        userId: createAuctionDto.createdBy,
        cardId: createAuctionDto.cardId,
      });
    });

    it('should throw a BadRequestException if card is not active', async () => {
      cardsService.isCardActive.mockResolvedValue(false);

      await expect(auctionsService.create(createAuctionDto)).rejects.toThrow(
        new BadRequestException('Card is not active'),
      );
      expect(cardsService.isCardActive).toHaveBeenCalledWith(
        createAuctionDto.cardId,
      );
      expect(auctionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw a BadRequestException if user does not have this card and is not admin', async () => {
      const createAuctionDtoWithUserRole = {
        ...createAuctionDto,
        role: Role.User,
      };
      cardsService.isCardActive.mockResolvedValue(true);
      cardInstancesService.findAll.mockResolvedValue([]);

      await expect(
        auctionsService.create(createAuctionDtoWithUserRole),
      ).rejects.toThrow(new BadRequestException("You don't have this card"));
      expect(cardsService.isCardActive).toHaveBeenCalledWith(
        createAuctionDto.cardId,
      );
      expect(cardInstancesService.findAll).toHaveBeenCalledWith({
        userId: createAuctionDto.createdBy,
        cardsId: [createAuctionDto.cardId],
      });
      expect(auctionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of auctions', async () => {
      const findAllAuctionsData = {
        page: 1,
        take: 20,
        isUserTakePart: true,
        isUserLeader: true,
        participantId: 'participantId',
        createdById: 'createdById',
        is_completed: true,
      };
      const mockAuctions = [
        {
          id: 'auction-id',
          highest_bid_user: findAllAuctionsData.participantId,
          created_by_id: findAllAuctionsData.createdById,
          is_completed: 1,
        },
      ];
      auctionRepository.findAll.mockResolvedValue({
        auctions: mockAuctions as any,
        totalCount: 1,
      });

      await expect(
        auctionsService.findAll(findAllAuctionsData),
      ).resolves.toEqual({
        data: [
          {
            id: mockAuctions[0].id,
            is_user_leader: true,
            is_completed: true,
            is_this_user_auction: false,
          },
        ],
        info: {
          page: findAllAuctionsData.page,
          totalCount: mockAuctions.length,
          totalPages: 1,
        },
      });

      expect(auctionRepository.findAll).toHaveBeenCalledWith({
        ...findAllAuctionsData,
        page: findAllAuctionsData.page,
        take: findAllAuctionsData.take,
        isUserLeader: findAllAuctionsData.isUserLeader,
        isUserTakePart: findAllAuctionsData.isUserTakePart,
        createdById: findAllAuctionsData.createdById,
        participantId: findAllAuctionsData.participantId,
      });
    });
  });

  describe('getHighestBidRange', () => {
    it('should return the highest and lowest bids', async () => {
      const mockAuctionWithHighestBid = {
        ...mockAuction,
        id: 'auction-1-id',
        highest_bid: 300,
      };
      const mockAuctionWithLowestBid = {
        ...mockAuction,
        id: 'auction-2-id',
        highest_bid: 100,
      };

      auctionRepository.findAll.mockResolvedValueOnce({
        auctions: [mockAuctionWithHighestBid as any],
        totalCount: 1,
      });
      auctionRepository.findAll.mockResolvedValueOnce({
        auctions: [mockAuctionWithLowestBid as any],
        totalCount: 1,
      });

      await expect(auctionsService.getHighestBidRange()).resolves.toEqual({
        max: mockAuctionWithHighestBid.highest_bid,
        min: mockAuctionWithLowestBid.highest_bid,
      });

      expect(auctionRepository.findAll).toHaveBeenCalledTimes(2);
      expect(auctionRepository.findAll).toHaveBeenCalledWith({
        isCompleted: false,
        sortOrder: 'desc',
        sortBy: 'highestBid',
        take: 1,
      });
      expect(auctionRepository.findAll).toHaveBeenCalledWith({
        isCompleted: false,
        sortOrder: 'asc',
        sortBy: 'highestBid',
        take: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should find auction if it exists', async () => {
      const auctionId = mockAuction.id;
      const userId = 'user-id';
      const mockAuctionWithDetails = {
        id: 'auctionId',
        starting_bid: 100,
        min_bid_step: 2,
        max_bid: 1000,
        min_length: 5,
        end_time: MOCK_DATE,
        is_completed: false,
        created_at: MOCK_DATE,
        created_by: {
          id: 'created-by-id',
        },
        card_instance: {
          cards: {
            id: 'card-id',
          },
        },
        bids: [
          {
            bid_amount: 200,
            user_id: userId,
          },
        ],
      };
      const mockCard = {
        ...MOCK_CARD,
        is_owned: false,
      };
      auctionRepository.findOne.mockResolvedValue(
        mockAuctionWithDetails as any,
      );
      cardInstancesService.attachOwnershipFlag.mockResolvedValue([
        mockCard as any,
      ]);

      await expect(auctionsService.findOne(auctionId, userId)).resolves.toEqual(
        {
          id: mockAuctionWithDetails.id,
          starting_bid: mockAuctionWithDetails.starting_bid,
          min_bid_step: mockAuctionWithDetails.min_bid_step,
          max_bid: mockAuctionWithDetails.max_bid,
          min_length: mockAuctionWithDetails.min_length,
          end_time: mockAuctionWithDetails.end_time,
          is_completed: mockAuctionWithDetails.is_completed,
          created_at: MOCK_DATE,
          card: mockCard,
          is_this_user_auction: false,
          highest_bid: {
            amount: 200,
            is_this_user_bid: true,
          },
        },
      );
      expect(auctionRepository.findOne).toHaveBeenCalledWith(auctionId);
      expect(cardInstancesService.attachOwnershipFlag).toHaveBeenCalledWith(
        [mockAuctionWithDetails.card_instance.cards],
        userId,
      );
    });

    it('should throw NotFoundException if auction does not exist', async () => {
      const auctionId = 'non-existing-auction-id';
      auctionRepository.findOne.mockResolvedValue(null);

      await expect(
        auctionsService.findOne(auctionId, 'user-id'),
      ).rejects.toThrow(new NotFoundException('Auction not found'));
    });
  });

  describe('update', () => {
    it('should update an auction if it is not completed', async () => {
      const auctionId = mockAuction.id;
      const updateAuctionDto = {
        startingBid: 200,
      };
      const mockUncompletedAuction = {
        ...mockAuction,
        is_completed: false,
      };
      const mockUpdatedAuction = {
        ...mockUncompletedAuction,
        starting_bid: updateAuctionDto.startingBid,
      };

      auctionRepository.findOne.mockResolvedValue(
        mockUncompletedAuction as any,
      );
      auctionRepository.update.mockResolvedValue(mockUpdatedAuction as any);

      await expect(
        auctionsService.update(auctionId, updateAuctionDto),
      ).resolves.toEqual(mockUpdatedAuction);
      expect(auctionRepository.findOne).toHaveBeenCalledWith(auctionId);
      expect(auctionRepository.update).toHaveBeenCalledWith(
        auctionId,
        updateAuctionDto,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AuctionEvent.CHANGED,
        new AuctionChangedEvent({
          id: auctionId,
          ...updateAuctionDto,
        }),
      );
    });

    it('should throw an ForbiddenException if auction is completed', async () => {
      const auctionId = mockAuction.id;
      const updateAuctionDto = {
        startingBid: 200,
      };
      const mockCompletedAuction = {
        ...mockAuction,
        is_completed: true,
      };
      auctionRepository.findOne.mockResolvedValue(mockCompletedAuction as any);
      await expect(
        auctionsService.update(auctionId, updateAuctionDto),
      ).rejects.toThrow(
        new ForbiddenException(
          'You cannot update an auction that has already ended!',
        ),
      );
      expect(auctionRepository.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an auction if it is not completed', async () => {
      const auctionId = mockAuction.id;
      const mockUncompletedAuction = {
        ...mockAuction,
        is_completed: false,
      };

      auctionRepository.findOne.mockResolvedValue(
        mockUncompletedAuction as any,
      );

      await expect(auctionsService.remove(auctionId)).resolves.toEqual(
        mockUncompletedAuction,
      );
      expect(auctionRepository.findOne).toHaveBeenCalledWith(auctionId);
      expect(auctionRepository.remove).toHaveBeenCalledWith(auctionId);
    });

    it('should throw an ForbiddenException if auction is completed', async () => {
      const auctionId = mockAuction.id;
      const mockUncompletedAuction = {
        ...mockAuction,
        is_completed: true,
      };

      auctionRepository.findOne.mockResolvedValue(
        mockUncompletedAuction as any,
      );
      await expect(auctionsService.remove(auctionId)).rejects.toThrow(
        new ForbiddenException(
          'You cannot delete an auction that has already ended!',
        ),
      );
      expect(auctionRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('finishAuction', () => {
    it('should mark an auction as completed and emit auction finished event, seller and winner rating update events if auction has bids', async () => {
      const auctionId = mockAuction.id;
      const mockFinishedAuction = {
        ...mockAuction,
        is_completed: true,
        bids: [
          {
            user_id: 'user-id',
            bid_amount: 200,
          },
        ],
      };

      auctionRepository.update.mockResolvedValue(mockFinishedAuction as any);
      await auctionsService.finishAuction(auctionId);

      expect(auctionRepository.update).toHaveBeenCalledWith(auctionId, {
        isCompleted: true,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AuctionEvent.FINISHED,
        new AuctionsFinishedEvent({
          id: auctionId,
          cardInstanceId: mockFinishedAuction.card_instance_id,
          winnerId: mockFinishedAuction.bids[0].user_id,
          sellerId: mockFinishedAuction.created_by_id,
          highestBid: mockFinishedAuction.bids[0].bid_amount,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RatingEvent.UPDATE,
        new UpdateRatingEvent({
          userId: mockFinishedAuction.created_by_id,
          pointsAmount: 1,
          action: RatingAction.DECREASE,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RatingEvent.UPDATE,
        new UpdateRatingEvent({
          userId: mockFinishedAuction.bids[0].user_id,
          pointsAmount: 1,
          action: RatingAction.INCREASE,
        }),
      );
    });

    it('should not emit any events if auction has no bids, but mark it as completed', async () => {
      const auctionId = mockAuction.id;
      const mockFinishedAuction = {
        ...mockAuction,
        is_completed: true,
        bids: [],
      };

      auctionRepository.update.mockResolvedValue(mockFinishedAuction as any);
      await auctionsService.finishAuction(auctionId);

      expect(auctionRepository.update).toHaveBeenCalledWith(auctionId, {
        isCompleted: true,
      });
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('extendAuctionIfNecessary', () => {
    it('should extend the auction if a bid has been made and the time left until completion is less than the minimum', async () => {
      const auctionId = mockAuction.id;
      const minLength = 3;
      const endTime = new Date(
        new Date().getTime() + (minLength - 1) * 60 * 1000,
      );
      const bidEvent = {
        auctionId,
        createdAt: new Date(),
        bidAmount: 200,
      };
      const mockFinishedAuction = {
        ...mockAuction,
        end_time: endTime,
        min_length: minLength,
        is_completed: false,
        bids: [],
      };

      auctionRepository.findOne.mockResolvedValue(mockFinishedAuction as any);
      await auctionsService.extendAuctionIfNecessary(bidEvent);

      const expectedEndTime = new Date(
        bidEvent.createdAt.getTime() + minLength * 60 * 1000,
      );
      expect(auctionRepository.update).toHaveBeenCalledWith(auctionId, {
        endTime: expectedEndTime,
      });
    });

    it('should not extend the auction if a bid has been made and the time left until completion is greater than the minimum', async () => {
      const auctionId = mockAuction.id;
      const minLength = 3;
      const endTime = new Date(
        new Date().getTime() + (minLength + 1) * 60 * 1000,
      );
      const bidEvent = {
        auctionId,
        createdAt: new Date(),
        bidAmount: 200,
      };
      const mockFinishedAuction = {
        ...mockAuction,
        end_time: endTime,
        min_length: minLength,
        is_completed: false,
        bids: [],
      };

      auctionRepository.findOne.mockResolvedValue(mockFinishedAuction as any);
      await auctionsService.extendAuctionIfNecessary(bidEvent);

      expect(auctionRepository.update).not.toHaveBeenCalled();
    });
  });
});
