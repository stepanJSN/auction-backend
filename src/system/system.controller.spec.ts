import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { MOCK_DATE } from 'config/mock-test-data';

describe('SystemController', () => {
  let systemController: SystemController;
  let systemService: DeepMockProxy<SystemService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [
        { provide: SystemService, useValue: mockDeep<SystemService>() },
      ],
    }).compile();

    systemController = module.get(SystemController);
    systemService = module.get(SystemService);
  });

  describe('findOne', () => {
    it('should return the exchange rate', async () => {
      const mockExchangeRate = {
        exchange_rate: 1.5,
        updated_at: MOCK_DATE,
      };

      systemService.findExchangeRate.mockResolvedValue(mockExchangeRate);

      await expect(systemController.findOne()).resolves.toEqual(
        mockExchangeRate,
      );
      expect(systemService.findExchangeRate).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update the exchange rate', async () => {
      const newValue = 1.5;
      const mockExchangeRate = {
        exchange_rate: newValue,
        updated_at: MOCK_DATE,
      };

      systemService.updateExchangeRate.mockResolvedValue(mockExchangeRate);

      await expect(
        systemController.update({ exchangeRate: newValue }),
      ).resolves.toEqual(mockExchangeRate);
      expect(systemService.updateExchangeRate).toHaveBeenCalledWith(newValue);
    });
  });
});
