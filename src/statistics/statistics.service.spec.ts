import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AuctionsService } from 'src/auctions/auctions.service';
import { CardsService } from 'src/cards/cards.service';
import { SetsService } from 'src/sets/sets.service';
import { UsersService } from 'src/users/users.service';
import { StatisticsService } from './statistics.service';
import { MOCK_CARD } from 'config/mock-test-data';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { SET_1, SET_2 } from 'src/sets/mockData';

describe('StatisticsService', () => {
  let statisticsService: StatisticsService;
  let cardsService: DeepMockProxy<CardsService>;
  let cardInstancesService: DeepMockProxy<CardInstancesService>;
  let setsService: DeepMockProxy<SetsService>;
  let auctionsService: DeepMockProxy<AuctionsService>;
  let usersService: DeepMockProxy<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: CardsService, useValue: mockDeep<CardsService>() },
        { provide: SetsService, useValue: mockDeep<SetsService>() },
        {
          provide: CardInstancesService,
          useValue: mockDeep<CardInstancesService>(),
        },
        { provide: AuctionsService, useValue: mockDeep<AuctionsService>() },
        { provide: UsersService, useValue: mockDeep<UsersService>() },
      ],
    }).compile();

    statisticsService = module.get(StatisticsService);
    cardsService = module.get(CardsService);
    setsService = module.get(SetsService);
    cardInstancesService = module.get(CardInstancesService);
    auctionsService = module.get(AuctionsService);
    usersService = module.get(UsersService);
  });

  describe('getCardsStatistics', () => {
    it('should return cards statistics', async () => {
      const page = 1;
      const take = 20;
      const card1 = {
        ...MOCK_CARD,
        id: 'card1',
        name: 'Card 1',
      };
      const card2 = {
        ...MOCK_CARD,
        id: 'card2',
        name: 'Card 2',
      };
      const auction1 = {
        highest_bid: 10,
      };
      const auction2 = {
        highest_bid: 15,
      };
      const auction3 = {
        highest_bid: 25,
      };

      cardsService.findAll.mockResolvedValue({
        data: [card1, card2],
        info: {
          page,
          totalPages: 1,
          totalCount: 2,
        },
      });
      cardInstancesService.countAllByCardId.mockResolvedValueOnce(1);
      cardInstancesService.countAllByCardId.mockResolvedValueOnce(2);
      auctionsService.findAll.mockResolvedValueOnce({
        data: [auction1 as any],
        info: {
          page: 1,
          totalPages: 1,
          totalCount: 1,
        },
      });
      auctionsService.findAll.mockResolvedValueOnce({
        data: [auction2 as any, auction3 as any],
        info: {
          page: 1,
          totalPages: 1,
          totalCount: 2,
        },
      });

      const result = await statisticsService.getCardsStatistics(page, take);

      expect(cardsService.findAll).toHaveBeenCalledWith({
        page,
        take,
      });
      expect(cardInstancesService.countAllByCardId).toHaveBeenCalledTimes(2);
      expect(cardInstancesService.countAllByCardId).toHaveBeenCalledWith(
        card1.id,
      );
      expect(cardInstancesService.countAllByCardId).toHaveBeenCalledWith(
        card2.id,
      );
      expect(auctionsService.findAll).toHaveBeenCalledTimes(2);
      expect(auctionsService.findAll).toHaveBeenCalledWith({
        cardId: card1.id,
        page: 1,
        take: 30,
      });
      expect(auctionsService.findAll).toHaveBeenCalledWith({
        cardId: card2.id,
        page: 1,
        take: 30,
      });

      expect(result).toEqual({
        data: [
          {
            id: card1.id,
            cardName: card1.name,
            numberOfInstances: 1,
            averagePrice: 10,
          },
          {
            id: card2.id,
            cardName: card2.name,
            numberOfInstances: 2,
            averagePrice: 20,
          },
        ],
        info: {
          page,
          totalCount: 2,
          totalPages: 1,
        },
      });
    });
  });

  describe('getNumberOfUsersPerSet', () => {
    it('should return number of users per set', async () => {
      const page = 1;
      const take = 20;
      const mockFindAllSetsResponse = {
        data: [SET_1, SET_2],
        info: {
          page: 1,
          totalCount: 2,
          totalPages: 1,
        },
      };

      setsService.findAll.mockResolvedValue(mockFindAllSetsResponse);
      cardInstancesService.findAllUsersWithCardsId.mockImplementationOnce(
        async ({ forEachUserWithSet }) => {
          forEachUserWithSet('user1Id');
          forEachUserWithSet('user2Id');
        },
      );
      cardInstancesService.findAllUsersWithCardsId.mockImplementationOnce(
        async ({ forEachUserWithSet }) => {
          forEachUserWithSet('user1Id');
          forEachUserWithSet('user2Id');
          forEachUserWithSet('user3Id');
        },
      );

      const result = await statisticsService.getNumberOfUsersPerSet(page, take);

      expect(setsService.findAll).toHaveBeenCalledWith({
        page,
        take,
      });
      expect(
        cardInstancesService.findAllUsersWithCardsId,
      ).toHaveBeenCalledTimes(mockFindAllSetsResponse.data.length);
      expect(result).toEqual({
        data: [
          {
            id: SET_1.id,
            setName: SET_1.name,
            numberOfUsers: 2,
          },
          {
            id: SET_2.id,
            setName: SET_2.name,
            numberOfUsers: 3,
          },
        ],
        info: {
          page,
          totalCount: mockFindAllSetsResponse.info.totalCount,
          totalPages: mockFindAllSetsResponse.info.totalPages,
        },
      });
    });
  });

  describe('getTopUsersByCollectedCards', () => {
    it('should return top users by collected cards', async () => {
      const numberOfUsers = 2;
      const user1Data = {
        id: 'userId1',
        name: 'name1',
        surname: 'surname1',
      };
      const user2Data = {
        id: 'userId2',
        name: 'name2',
        surname: 'surname2',
      };
      const mockGroupCardByUserResponse = [
        {
          user_id: user1Data.id,
          _count: {
            user_id: 13,
          },
        },
        {
          user_id: user2Data.id,
          _count: {
            user_id: 8,
          },
        },
      ];

      cardInstancesService.groupCardByParam.mockResolvedValue(
        mockGroupCardByUserResponse as any,
      );
      usersService.findOneById.mockResolvedValueOnce(user1Data as any);
      usersService.findOneById.mockResolvedValueOnce(user2Data as any);

      const result =
        await statisticsService.getTopUsersByCollectedCards(numberOfUsers);

      expect(cardInstancesService.groupCardByParam).toHaveBeenCalledWith({
        param: 'user_id',
        sortOrder: 'desc',
        take: numberOfUsers,
      });
      expect(usersService.findOneById).toHaveBeenCalledTimes(
        mockGroupCardByUserResponse.length,
      );
      expect(usersService.findOneById).toHaveBeenCalledWith(user1Data.id);
      expect(usersService.findOneById).toHaveBeenCalledWith(user2Data.id);
      expect(result).toEqual([
        {
          id: user1Data.id,
          name: user1Data.name,
          surname: user1Data.surname,
          numberOfCards: mockGroupCardByUserResponse[0]._count.user_id,
        },
        {
          id: user2Data.id,
          name: user2Data.name,
          surname: user2Data.surname,
          numberOfCards: mockGroupCardByUserResponse[1]._count.user_id,
        },
      ]);
    });
  });

  describe('getGeneral', () => {
    it('should return general statistics', async () => {
      const mockMostRepeatedCard = {
        ...MOCK_CARD,
        id: 'mostRepeatedCardId',
        name: 'Popular card',
      };
      const mockMostRepeatedCardId = {
        card_id: mockMostRepeatedCard.id,
        _count: {
          card_id: 15,
        },
      };
      const mockLeastRepeatedCard = {
        ...MOCK_CARD,
        id: 'leastRepeatedCardId',
        name: 'Least popular card',
      };
      const mockLeastRepeatedCardId = {
        card_id: mockLeastRepeatedCard.id,
        _count: {
          card_id: 1,
        },
      };
      const mockNumberOfCardsCreatedByAdmin = 10;

      cardInstancesService.groupCardByParam.mockResolvedValueOnce([
        mockMostRepeatedCardId as any,
      ]);
      cardsService.findOne.mockResolvedValueOnce(mockMostRepeatedCard as any);
      cardInstancesService.groupCardByParam.mockResolvedValueOnce([
        mockLeastRepeatedCardId as any,
      ]);
      cardsService.findOne.mockResolvedValueOnce(mockLeastRepeatedCard as any);
      cardsService.countNumberOfCardsCreatedByAdmin.mockResolvedValueOnce(
        mockNumberOfCardsCreatedByAdmin,
      );

      const result = await statisticsService.getGeneral();

      expect(cardInstancesService.groupCardByParam).toHaveBeenCalledTimes(2);
      expect(cardInstancesService.groupCardByParam).toHaveBeenCalledWith({
        param: 'card_id',
        sortOrder: 'desc',
        take: 1,
      });
      expect(cardInstancesService.groupCardByParam).toHaveBeenCalledWith({
        param: 'card_id',
        sortOrder: 'asc',
        take: 1,
      });
      expect(cardsService.findOne).toHaveBeenCalledTimes(2);
      expect(cardsService.findOne).toHaveBeenCalledWith(
        mockMostRepeatedCard.id,
      );
      expect(cardsService.findOne).toHaveBeenCalledWith(
        mockLeastRepeatedCard.id,
      );
      expect(
        cardsService.countNumberOfCardsCreatedByAdmin,
      ).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        mostRepeatedCard: {
          id: mockMostRepeatedCard.id,
          name: mockMostRepeatedCard.name,
          numberOfInstances: mockMostRepeatedCardId._count.card_id,
        },
        leastRepeatedCard: {
          id: mockLeastRepeatedCard.id,
          name: mockLeastRepeatedCard.name,
          numberOfInstances: mockLeastRepeatedCardId._count.card_id,
        },
        numberOfCardsCreatedByAdmin: mockNumberOfCardsCreatedByAdmin,
      });
    });
  });
});
