import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { SystemRepository } from './system.repository';
import { SystemService } from './system.service';
import { MOCK_DATE } from 'config/mock-test-data';

describe('SystemService', () => {
  let systemService: SystemService;
  let systemRepository: DeepMockProxy<SystemRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SystemService,
        { provide: SystemRepository, useValue: mockDeep<SystemRepository>() },
      ],
    }).compile();

    systemService = module.get(SystemService);
    systemRepository = module.get(SystemRepository);
  });

  describe('findExchangeRate', () => {
    it('should return the exchange rate', async () => {
      const mockExchangeRate = {
        id: 'rate_id',
        key: 'exchange_rate',
        value: '1.5',
        updated_at: MOCK_DATE,
      };

      systemRepository.findOne.mockResolvedValue(mockExchangeRate);

      await expect(systemService.findExchangeRate()).resolves.toEqual({
        exchange_rate: +mockExchangeRate.value,
        updated_at: mockExchangeRate.updated_at,
      });

      expect(systemRepository.findOne).toHaveBeenCalledWith(
        mockExchangeRate.key,
      );
    });
  });

  describe('updateExchangeRate', () => {
    it('should update the exchange rate', async () => {
      const newValue = 1.5;
      const mockExchangeRate = {
        id: 'rate_id',
        key: 'exchange_rate',
        value: newValue.toString(),
        updated_at: MOCK_DATE,
      };

      systemRepository.update.mockResolvedValue(mockExchangeRate);

      await expect(systemService.updateExchangeRate(newValue)).resolves.toEqual(
        {
          exchange_rate: +mockExchangeRate.value,
          updated_at: mockExchangeRate.updated_at,
        },
      );
      expect(systemRepository.update).toHaveBeenCalledWith(
        mockExchangeRate.key,
        newValue.toString(),
      );
    });
  });
});
