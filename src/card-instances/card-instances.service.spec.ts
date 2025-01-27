import { Test, TestingModule } from '@nestjs/testing';
import { CardInstancesService } from './card-instances.service';
import { CardInstancesRepository } from './card-instances.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RatingEvent } from 'src/users/enums/rating-event.enum';
import { AuctionsFinishedEvent } from 'src/auctions/events/auction-finished.event';
import {
  UpdateRatingEvent,
  RatingAction,
} from 'src/users/events/update-rating.event';
import {
  MOCK_CARD,
  MOCK_CARD_ID,
  MOCK_DATE,
  MOCK_ID,
  MOCK_USER_ID,
} from 'config/mock-test-data';
import { GroupCardByParamType } from './types/group-card-by-param.type';
import { SetEventPayload } from 'src/sets/events/set.event';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('CardInstancesService', () => {
  let cardInstancesService: CardInstancesService;
  let cardInstancesRepository: DeepMockProxy<CardInstancesRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockCardInstance = {
    id: MOCK_ID,
    user_id: MOCK_USER_ID,
    created_at: MOCK_DATE,
    card_id: MOCK_CARD_ID,
  };
  const setEventPayload = new SetEventPayload({
    bonus: 10,
    cardsId: [MOCK_CARD_ID],
  });
  const mockGroup = [
    {
      _count: { card_id: 1 },
      user_id: MOCK_USER_ID,
    },
  ];

  beforeEach(async () => {
    const mockedEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardInstancesService,
        {
          provide: CardInstancesRepository,
          useValue: mockDeep<CardInstancesRepository>(),
        },
        {
          provide: EventEmitter2,
          useValue: mockedEventEmitter,
        },
      ],
    }).compile();

    cardInstancesService = module.get(CardInstancesService);
    cardInstancesRepository = module.get(CardInstancesRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should create a card instance', async () => {
    const mockCreateCardInstancePayload = {
      userId: MOCK_USER_ID,
      cardId: MOCK_CARD_ID,
    };
    cardInstancesRepository.create.mockResolvedValue(mockCardInstance);

    const result = await cardInstancesService.create(
      mockCreateCardInstancePayload,
    );

    expect(cardInstancesRepository.create).toHaveBeenCalledWith(
      mockCreateCardInstancePayload,
    );
    expect(result).toEqual(mockCardInstance);
  });

  it('should find one card instance by ID', async () => {
    const mockCardInstanceId = MOCK_ID;
    cardInstancesRepository.findOne.mockResolvedValue(mockCardInstance);

    const result = await cardInstancesService.findOne(mockCardInstanceId);

    expect(cardInstancesRepository.findOne).toHaveBeenCalledWith(
      mockCardInstanceId,
    );
    expect(result).toEqual(mockCardInstance);
  });

  it('should find all card instances', async () => {
    const mockFindAllPayload = {
      cardsId: [MOCK_CARD_ID],
      userId: MOCK_USER_ID,
    };
    cardInstancesRepository.findAll.mockResolvedValue([mockCardInstance]);

    const result = await cardInstancesService.findAll(mockFindAllPayload);

    expect(cardInstancesRepository.findAll).toHaveBeenCalledWith(
      mockFindAllPayload,
    );
    expect(result).toEqual([mockCardInstance]);
  });

  it('should count all card instances by card ID', async () => {
    cardInstancesRepository.countByCardId.mockResolvedValue(5);

    const result = await cardInstancesService.countAllByCardId(MOCK_CARD_ID);

    expect(cardInstancesRepository.countByCardId).toHaveBeenCalledWith(
      MOCK_CARD_ID,
    );
    expect(result).toBe(5);
  });

  it('should group card instances by param', async () => {
    const mockGroupPayload: GroupCardByParamType = {
      param: 'user_id',
      sortOrder: 'asc',
      take: 10,
    };
    const mockGroup = [
      {
        user_id: MOCK_USER_ID,
        _count: { user_id: 1 },
      },
    ] as any;
    cardInstancesRepository.groupCardByParam.mockResolvedValue(mockGroup);

    const result =
      await cardInstancesService.groupCardByParam(mockGroupPayload);

    expect(cardInstancesRepository.groupCardByParam).toHaveBeenCalledWith(
      mockGroupPayload,
    );
    expect(result).toEqual(mockGroup);
  });

  it('should update card owner on auction finished', async () => {
    const WINNER_ID = 'winner_id';
    const SELLER_ID = 'seller_id';
    const CARD_INSTANCE_ID = 'card_instance_id';
    const event = new AuctionsFinishedEvent({
      id: MOCK_ID,
      winnerId: WINNER_ID,
      sellerId: SELLER_ID,
      cardInstanceId: CARD_INSTANCE_ID,
      highestBid: 100,
    });
    cardInstancesRepository.update.mockResolvedValue(mockCardInstance);

    await cardInstancesService.updateCardOwner(event);

    expect(cardInstancesRepository.update).toHaveBeenCalledWith(
      event.cardInstanceId,
      { userId: event.winnerId },
    );
  });

  it('should find all users with cards', async () => {
    const cardsId = [MOCK_CARD_ID];
    const mockForEachUserWithSet = jest.fn();
    const mockGroup = [
      {
        _count: { card_id: 1 },
        user_id: MOCK_USER_ID + 1,
      },
      {
        _count: { card_id: 1 },
        user_id: MOCK_USER_ID + 2,
      },
    ];

    cardInstancesRepository.groupByUserIdWithCards.mockResolvedValue(mockGroup);

    await cardInstancesService.findAllUsersWithCardsId({
      cardsId,
      forEachUserWithSet: mockForEachUserWithSet,
    });

    expect(cardInstancesRepository.groupByUserIdWithCards).toHaveBeenCalledWith(
      cardsId,
    );

    expect(mockForEachUserWithSet).toHaveBeenCalledWith(mockGroup[0].user_id);
    expect(mockForEachUserWithSet).toHaveBeenCalledWith(mockGroup[1].user_id);
    expect(mockForEachUserWithSet).toHaveBeenCalledTimes(2);
  });

  it('should handle set creation event and update user rating', async () => {
    cardInstancesRepository.groupByUserIdWithCards.mockResolvedValue(mockGroup);
    await cardInstancesService.handleSetCreate(setEventPayload);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      RatingEvent.UPDATE,
      new UpdateRatingEvent({
        userId: mockGroup[0].user_id,
        pointsAmount: setEventPayload.bonus,
        action: RatingAction.INCREASE,
      }),
    );
  });

  it('should handle set remove event and update user rating', async () => {
    cardInstancesRepository.groupByUserIdWithCards.mockResolvedValue(mockGroup);
    await cardInstancesService.handleSetRemove(setEventPayload);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      RatingEvent.UPDATE,
      new UpdateRatingEvent({
        userId: mockGroup[0].user_id,
        pointsAmount: setEventPayload.bonus,
        action: RatingAction.DECREASE,
      }),
    );
  });

  it('should handle set update event and update user rating if bonus is positive', async () => {
    cardInstancesRepository.groupByUserIdWithCards.mockResolvedValue(mockGroup);
    await cardInstancesService.handleSetUpdate(setEventPayload);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      RatingEvent.UPDATE,
      new UpdateRatingEvent({
        userId: mockGroup[0].user_id,
        pointsAmount: setEventPayload.bonus,
        action: RatingAction.INCREASE,
      }),
    );
  });

  it('should handle set update event and update user rating if bonus is negative', async () => {
    const setEventPayload = new SetEventPayload({
      bonus: -10,
      cardsId: [MOCK_CARD_ID],
    });
    cardInstancesRepository.groupByUserIdWithCards.mockResolvedValue(mockGroup);
    await cardInstancesService.handleSetUpdate(setEventPayload);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      RatingEvent.UPDATE,
      new UpdateRatingEvent({
        userId: mockGroup[0].user_id,
        pointsAmount: Math.abs(setEventPayload.bonus),
        action: RatingAction.DECREASE,
      }),
    );
  });

  it('should attach ownership flag if user owns the card', async () => {
    const mockCards = [MOCK_CARD];
    cardInstancesRepository.findAll.mockResolvedValue([mockCardInstance]);

    const result = await cardInstancesService.attachOwnershipFlag(
      mockCards,
      MOCK_USER_ID,
    );

    expect(cardInstancesRepository.findAll).toHaveBeenCalledWith({
      userId: MOCK_USER_ID,
      cardsId: [mockCards[0].id],
    });
    expect(result).toEqual([{ ...MOCK_CARD, is_owned: true }]);
  });

  it('should not attach ownership flag if user does not own the card', async () => {
    const mockCards = [MOCK_CARD];
    cardInstancesRepository.findAll.mockResolvedValue([]);

    const result = await cardInstancesService.attachOwnershipFlag(
      mockCards,
      MOCK_USER_ID,
    );

    expect(cardInstancesRepository.findAll).toHaveBeenCalledWith({
      userId: MOCK_USER_ID,
      cardsId: [mockCards[0].id],
    });
    expect(result).toEqual([{ ...MOCK_CARD, is_owned: false }]);
  });
});
