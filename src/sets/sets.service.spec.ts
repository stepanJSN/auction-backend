import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { SetsService } from './sets.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CardsService } from 'src/cards/cards.service';
import { SetsRepository } from './sets.repository';
import { Test } from '@nestjs/testing';
import { MOCK_DATE, MOCK_USER_ID } from 'config/mock-test-data';
import { SetEvent } from './enums/set-event.enum';
import { SetEventPayload } from './events/set.event';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RatingEvent } from 'src/users/enums/rating-event.enum';
import {
  RatingAction,
  UpdateRatingEvent,
} from 'src/users/events/update-rating.event';
import { SET_1, CARD_1, CARD_2, SET_2 } from './mockData';

describe('SetsService', () => {
  let setsService: SetsService;
  let setsRepository: DeepMockProxy<SetsRepository>;
  let cardsService: DeepMockProxy<CardsService>;
  let cardInstancesService: DeepMockProxy<CardInstancesService>;
  let eventEmitter: DeepMockProxy<EventEmitter2>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SetsService,
        { provide: SetsRepository, useValue: mockDeep<SetsRepository>() },
        { provide: CardsService, useValue: mockDeep<CardsService>() },
        {
          provide: CardInstancesService,
          useValue: mockDeep<CardInstancesService>(),
        },
        { provide: EventEmitter2, useValue: mockDeep<EventEmitter2>() },
      ],
    }).compile();

    setsService = module.get(SetsService);
    setsRepository = module.get(SetsRepository);
    cardsService = module.get(CardsService);
    cardInstancesService = module.get(CardInstancesService);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('create', () => {
    it('should create a set if all cards are active', async () => {
      const createSetDto = {
        name: SET_1.name,
        bonus: SET_1.bonus,
        cardsId: SET_1.cards.map((card) => card.id),
      };

      cardsService.isCardActive.mockResolvedValue(true);
      setsRepository.create.mockResolvedValue(SET_1);

      const result = await setsService.create(createSetDto);

      expect(cardsService.isCardActive).toHaveBeenCalledTimes(
        SET_1.cards.length,
      );
      expect(cardsService.isCardActive).toHaveBeenCalledWith(CARD_1.id);
      expect(cardsService.isCardActive).toHaveBeenCalledWith(CARD_2.id);
      expect(setsRepository.create).toHaveBeenCalledWith(createSetDto);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SetEvent.CREATE,
        new SetEventPayload({
          cardsId: SET_1.cards.map((card) => card.id),
          bonus: SET_1.bonus,
        }),
      );
      expect(result).toEqual(SET_1.id);
    });

    it('should throw BadRequestException if one of the cards is inactive', async () => {
      const createSetDto = {
        name: SET_1.name,
        bonus: SET_1.bonus,
        cardsId: SET_1.cards.map((card) => card.id),
      };

      cardsService.isCardActive.mockResolvedValueOnce(true);
      cardsService.isCardActive.mockResolvedValueOnce(false);

      await expect(setsService.create(createSetDto)).rejects.toThrow(
        new BadRequestException('One of the cards in the set is inactive'),
      );

      expect(cardsService.isCardActive).toHaveBeenCalledTimes(
        SET_1.cards.length,
      );
      expect(cardsService.isCardActive).toHaveBeenCalledWith(CARD_1.id);
      expect(cardsService.isCardActive).toHaveBeenCalledWith(CARD_2.id);
    });
  });

  describe('findAll', () => {
    const paginationPayload = {
      page: 1,
      take: 10,
    };
    const mockFindAllResponse = {
      sets: [SET_1, SET_2],
      totalCount: 2,
    };
    const expectedInfo = {
      page: paginationPayload.page,
      totalCount: mockFindAllResponse.totalCount,
      totalPages: Math.ceil(
        mockFindAllResponse.totalCount / paginationPayload.take,
      ),
    };

    it('should return an array of sets for Admin role', async () => {
      const findAllPayload = {
        ...paginationPayload,
        role: Role.Admin,
      };
      setsRepository.findAll.mockResolvedValue(mockFindAllResponse);

      const result = await setsService.findAll(findAllPayload);

      expect(setsRepository.findAll).toHaveBeenCalledWith(
        findAllPayload.page,
        findAllPayload.take,
      );
      expect(result).toEqual({
        data: mockFindAllResponse.sets,
        info: expectedInfo,
      });
    });

    it('should return an array of sets with ownership flag for User role', async () => {
      const findAllPayload = {
        ...paginationPayload,
        role: Role.User,
        userId: MOCK_USER_ID,
      };
      setsRepository.findAll.mockResolvedValue(mockFindAllResponse);
      cardInstancesService.attachOwnershipFlag.mockResolvedValueOnce([
        { ...CARD_1, is_owned: true },
        { ...CARD_2, is_owned: true },
      ]);
      cardInstancesService.attachOwnershipFlag.mockResolvedValueOnce([
        { ...CARD_1, is_owned: true },
        { ...CARD_2, is_owned: false },
      ]);

      const result = await setsService.findAll(findAllPayload);

      expect(setsRepository.findAll).toHaveBeenCalledWith(
        findAllPayload.page,
        findAllPayload.take,
      );
      expect(cardInstancesService.attachOwnershipFlag).toHaveBeenCalledTimes(
        mockFindAllResponse.totalCount,
      );
      expect(cardInstancesService.attachOwnershipFlag).toHaveBeenCalledWith(
        mockFindAllResponse.sets[0].cards,
        findAllPayload.userId,
      );
      expect(cardInstancesService.attachOwnershipFlag).toHaveBeenCalledWith(
        mockFindAllResponse.sets[1].cards,
        findAllPayload.userId,
      );
      expect(result).toEqual({
        data: [
          {
            ...mockFindAllResponse.sets[0],
            is_user_has_set: true,
            cards: [
              { ...CARD_1, is_owned: true },
              { ...CARD_2, is_owned: true },
            ],
          },
          {
            ...mockFindAllResponse.sets[1],
            is_user_has_set: false,
            cards: [
              { ...CARD_1, is_owned: true },
              { ...CARD_2, is_owned: false },
            ],
          },
        ],
        info: expectedInfo,
      });
    });
  });

  describe('findAllWithCard', () => {
    it('should return all sets with the specified card id', async () => {
      const cardId = CARD_1.id;
      const page = 1;
      const take = 20;
      const mockFindAllWithCardResponse = {
        sets: [
          {
            bonus: SET_1.bonus,
            cards: [{ id: CARD_1.id }, { id: CARD_2.id }],
          },
          {
            bonus: SET_2.bonus,
            cards: [{ id: CARD_1.id }, { id: CARD_2.id }],
          },
        ],
        totalCount: 2,
      };

      setsRepository.findAllWithCard.mockResolvedValue(
        mockFindAllWithCardResponse,
      );

      const result = await setsService.findAllWithCard(cardId, page, take);

      expect(setsRepository.findAllWithCard).toHaveBeenCalledWith(
        cardId,
        page,
        take,
      );
      expect(result).toEqual(mockFindAllWithCardResponse);
    });
  });

  describe('findOne', () => {
    it('should return a set if it exists', async () => {
      const id = SET_1.id;
      setsRepository.findOne.mockResolvedValue(SET_1);

      const result = await setsService.findOne(id);
      expect(setsRepository.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(SET_1);
    });

    it('should throw NotFoundException if set does not exist', async () => {
      const id = 'invalid-id';
      setsRepository.findOne.mockResolvedValue(null);

      await expect(setsService.findOne(id)).rejects.toThrow(
        new NotFoundException('Set not found'),
      );
    });
  });

  describe('checkUserCollectedSets on auction finished event', () => {
    const AuctionsFinishedEventPayload = {
      id: 'auctionId',
      cardInstanceId: 'cardsInstance1Id',
      winnerId: 'winnerId',
      sellerId: MOCK_USER_ID,
      highestBid: 100,
    };
    const mockFindOneCardInstanceResponse = {
      id: AuctionsFinishedEventPayload.cardInstanceId,
      card_id: CARD_1.id,
      created_at: MOCK_DATE,
      user_id: AuctionsFinishedEventPayload.sellerId,
    };

    it('should decrease seller rating if he sell card from collected set', async () => {
      const mockFindAllWithCardResponse = {
        sets: [
          {
            bonus: SET_1.bonus,
            cards: [{ id: CARD_1.id }, { id: CARD_2.id }],
          },
        ],
        totalCount: 1,
      };

      cardInstancesService.findOne.mockResolvedValueOnce(
        mockFindOneCardInstanceResponse,
      );
      setsRepository.findAllWithCard.mockResolvedValue(
        mockFindAllWithCardResponse,
      );
      cardInstancesService.findAll.mockResolvedValue([
        {
          id: 'cardsInstance2Id',
          card_id: CARD_2.id,
          created_at: MOCK_DATE,
          user_id: AuctionsFinishedEventPayload.sellerId,
        },
      ]);

      await setsService.checkUserCollectedSets(AuctionsFinishedEventPayload);

      expect(cardInstancesService.findOne).toHaveBeenCalledWith(
        AuctionsFinishedEventPayload.cardInstanceId,
      );
      expect(setsRepository.findAllWithCard).toHaveBeenCalledTimes(1);
      expect(setsRepository.findAllWithCard).toHaveBeenCalledWith(
        CARD_1.id,
        1,
        30,
      );
      expect(cardInstancesService.findAll).toHaveBeenCalledWith({
        cardsId: [CARD_2.id],
        userId: AuctionsFinishedEventPayload.sellerId,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RatingEvent.UPDATE,
        new UpdateRatingEvent({
          userId: AuctionsFinishedEventPayload.sellerId,
          pointsAmount: mockFindAllWithCardResponse.sets[0].bonus,
          action: RatingAction.DECREASE,
        }),
      );
    });

    it('should not decrease seller rating if he sell card from not collected set', async () => {
      const card3Id = 'anotherCardId';
      const mockFindAllWithCardResponse = {
        sets: [
          {
            bonus: SET_1.bonus,
            cards: [{ id: CARD_1.id }, { id: CARD_2.id }, { id: card3Id }],
          },
        ],
        totalCount: 1,
      };

      cardInstancesService.findOne.mockResolvedValueOnce(
        mockFindOneCardInstanceResponse,
      );
      setsRepository.findAllWithCard.mockResolvedValue(
        mockFindAllWithCardResponse,
      );
      cardInstancesService.findAll.mockResolvedValue([
        {
          id: 'cardsInstance2Id',
          card_id: CARD_2.id,
          created_at: MOCK_DATE,
          user_id: AuctionsFinishedEventPayload.sellerId,
        },
      ]);

      await setsService.checkUserCollectedSets(AuctionsFinishedEventPayload);

      expect(cardInstancesService.findOne).toHaveBeenCalledWith(
        AuctionsFinishedEventPayload.cardInstanceId,
      );
      expect(cardInstancesService.findAll).toHaveBeenCalledWith({
        cardsId: [CARD_2.id, card3Id],
        userId: AuctionsFinishedEventPayload.sellerId,
      });
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should increase winner rating if he buy card and collect set', async () => {
      const mockFindAllWithCardResponse = {
        sets: [
          {
            bonus: SET_1.bonus,
            cards: [{ id: CARD_1.id }, { id: CARD_2.id }],
          },
        ],
        totalCount: 1,
      };

      cardInstancesService.findOne.mockResolvedValueOnce(
        mockFindOneCardInstanceResponse,
      );
      setsRepository.findAllWithCard.mockResolvedValue(
        mockFindAllWithCardResponse,
      );
      cardInstancesService.findAll.mockResolvedValue([
        {
          id: 'cardsInstance2Id',
          card_id: CARD_2.id,
          created_at: MOCK_DATE,
          user_id: AuctionsFinishedEventPayload.winnerId,
        },
      ]);

      await setsService.checkUserCollectedSets(AuctionsFinishedEventPayload);

      expect(cardInstancesService.findOne).toHaveBeenCalledWith(
        AuctionsFinishedEventPayload.cardInstanceId,
      );
      expect(cardInstancesService.findAll).toHaveBeenCalledWith({
        cardsId: [CARD_2.id],
        userId: AuctionsFinishedEventPayload.winnerId,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RatingEvent.UPDATE,
        new UpdateRatingEvent({
          userId: AuctionsFinishedEventPayload.winnerId,
          pointsAmount: mockFindAllWithCardResponse.sets[0].bonus,
          action: RatingAction.INCREASE,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a set', async () => {
      const newCardId = 'newCardId';
      const updateSetDto = {
        name: 'Updated Set',
        bonus: 50,
        cardsId: [CARD_1.id, CARD_2.id, newCardId],
      };
      const mockUpdateSetRepositoryResponse = {
        ...SET_1,
        name: updateSetDto.name,
        bonus: updateSetDto.bonus,
        cards: [...SET_1.cards, { ...CARD_1, id: newCardId }],
      };

      setsRepository.findOne.mockResolvedValue(SET_1);
      setsRepository.update.mockResolvedValue(mockUpdateSetRepositoryResponse);

      const result = await setsService.update(SET_1.id, updateSetDto);

      expect(setsRepository.update).toHaveBeenCalledWith(
        SET_1.id,
        updateSetDto,
      );
      expect(setsRepository.findOne).toHaveBeenCalledWith(SET_1.id);
      expect(eventEmitter.emit).toHaveBeenCalledTimes(3);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SetEvent.UPDATE,
        new SetEventPayload({
          cardsId: mockUpdateSetRepositoryResponse.cards.map((card) => card.id),
          bonus: mockUpdateSetRepositoryResponse.bonus - SET_1.bonus,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SetEvent.REMOVE,
        new SetEventPayload({
          cardsId: SET_1.cards.map((card) => card.id),
          bonus: SET_1.bonus,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SetEvent.CREATE,
        new SetEventPayload({
          cardsId: mockUpdateSetRepositoryResponse.cards.map((card) => card.id),
          bonus: mockUpdateSetRepositoryResponse.bonus,
        }),
      );
      expect(result).toEqual(mockUpdateSetRepositoryResponse);
    });
  });

  describe('remove', () => {
    it('should remove a set', async () => {
      setsRepository.remove.mockResolvedValue(SET_1);

      await setsService.remove(SET_1.id);

      expect(setsRepository.remove).toHaveBeenCalledWith(SET_1.id);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SetEvent.REMOVE,
        new SetEventPayload({
          cardsId: SET_1.cards.map((card) => card.id),
          bonus: SET_1.bonus,
        }),
      );
    });
  });
});
