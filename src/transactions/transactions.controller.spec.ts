import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Test } from '@nestjs/testing';
import { MOCK_EMAIL, MOCK_USER_ID } from 'config/mock-test-data';
import { Role } from '@prisma/client';

describe('TransactionsController', () => {
  let transactionsController: TransactionsController;
  let transactionsService: DeepMockProxy<TransactionsService>;
  const mockUserBalance = {
    total: 1000,
    available: 900,
  };
  const createTransactionDto = {
    amount: 100,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        TransactionsService,
        {
          provide: TransactionsService,
          useValue: mockDeep<TransactionsService>(),
        },
      ],
    }).compile();

    transactionsController = module.get(TransactionsController);
    transactionsService = module.get(TransactionsService);
  });

  describe('topUp', () => {
    it('should top up user balance and return new balance', async () => {
      transactionsService.topUp.mockResolvedValue(mockUserBalance);

      await expect(
        transactionsController.topUp(createTransactionDto, MOCK_USER_ID),
      ).resolves.toEqual(mockUserBalance);
      expect(transactionsService.topUp).toHaveBeenCalledWith(
        createTransactionDto.amount,
        MOCK_USER_ID,
      );
    });
  });

  describe('withdraw', () => {
    it('should withdraw money from user balance and return new balance', async () => {
      const userData = {
        id: MOCK_USER_ID,
        role: Role.User,
        email: MOCK_EMAIL,
      };

      transactionsService.withdraw.mockResolvedValue(mockUserBalance);

      await expect(
        transactionsController.withdraw(createTransactionDto, userData),
      ).resolves.toEqual(mockUserBalance);
      expect(
        transactionsService.withdraw(createTransactionDto.amount, userData),
      );
    });
  });

  describe('calculateTotalFeeAmount', () => {
    it('should return total fee amount', async () => {
      const mockTotalFeeAmount = {
        totalFeeAmount: 200,
      };

      transactionsService.calculateTotalFeeAmount.mockResolvedValue(
        mockTotalFeeAmount,
      );

      await expect(
        transactionsController.calculateTotalFeeAmount(),
      ).resolves.toEqual(mockTotalFeeAmount);
      expect(transactionsService.calculateTotalFeeAmount).toHaveBeenCalled();
    });
  });
});
