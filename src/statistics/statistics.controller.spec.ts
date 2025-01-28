import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

describe('StatisticsController', () => {
  let statisticsController: StatisticsController;
  let statisticsService: DeepMockProxy<StatisticsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        StatisticsService,
        { provide: StatisticsService, useValue: mockDeep<StatisticsService>() },
      ],
    }).compile();

    statisticsController = module.get(StatisticsController);
    statisticsService = module.get(StatisticsService);
  });

  describe('getCardsStatistics', () => {
    it('should return cards statistics', async () => {
      const getCardsStatisticsDto = {
        page: 1,
        take: 20,
      };
      const mockServiceResponse = {
        data: [],
        info: {
          page: getCardsStatisticsDto.page,
          totalCount: 0,
          totalPages: 1,
        },
      };

      statisticsService.getCardsStatistics.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await statisticsController.getCardsStatistics(
        getCardsStatisticsDto,
      );

      expect(statisticsService.getCardsStatistics).toHaveBeenCalledWith(
        getCardsStatisticsDto.page,
        getCardsStatisticsDto.take,
      );
      expect(result).toEqual(mockServiceResponse);
    });
  });

  describe('getTopUsersByCollectedCards', () => {
    it('should return top users by collected cards', async () => {
      const numberOfUsers = 10;
      const mockServiceResponse = [];

      statisticsService.getTopUsersByCollectedCards.mockResolvedValue(
        mockServiceResponse,
      );

      const result =
        await statisticsController.getTopUsersByCollectedCards(numberOfUsers);

      expect(
        statisticsService.getTopUsersByCollectedCards,
      ).toHaveBeenCalledWith(numberOfUsers);
      expect(result).toEqual(mockServiceResponse);
    });
  });

  describe('getNumberOfUsersPerSet', () => {
    it('should return number of users per set', async () => {
      const getNumberOfUsersPerSetDto = {
        page: 1,
        take: 20,
      };
      const mockServiceResponse = {
        data: [],
        info: {
          page: getNumberOfUsersPerSetDto.page,
          totalCount: 0,
          totalPages: 1,
        },
      };

      statisticsService.getNumberOfUsersPerSet.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await statisticsController.getNumberOfUsersPerSet(
        getNumberOfUsersPerSetDto,
      );

      expect(statisticsService.getNumberOfUsersPerSet).toHaveBeenCalledWith(
        getNumberOfUsersPerSetDto.page,
        getNumberOfUsersPerSetDto.take,
      );
      expect(result).toEqual(mockServiceResponse);
    });
  });

  describe('getGeneral', () => {
    it('should return general statistics', async () => {
      const mockServiceResponse = {
        mostRepeatedCard: {
          id: 'mostRepeatedCardId',
          name: 'mostRepeatedCardName',
          numberOfInstances: 20,
        },
        leastRepeatedCard: {
          id: 'leastRepeatedCardId',
          name: 'leastRepeatedCardName',
          numberOfInstances: 10,
        },
        numberOfCardsCreatedByAdmin: 15,
      };

      statisticsService.getGeneral.mockResolvedValue(
        mockServiceResponse as any,
      );

      const result = await statisticsController.getGeneralStatistics();

      expect(statisticsService.getGeneral).toHaveBeenCalled();
      expect(result).toEqual(mockServiceResponse);
    });
  });
});
