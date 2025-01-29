import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AuctionsService } from 'src/auctions/auctions.service';
import { StripeService } from 'src/stripe/stripe.service';
import { TransactionsRepository } from './transactions.repository';
import { TransactionsService } from './transactions.service';
import { MOCK_DATE, MOCK_EMAIL, MOCK_USER_ID } from 'config/mock-test-data';
import { Prisma, Role } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { TransactionExceptionCode } from './transactions-exceptions.enum';

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  let transactionsRepository: DeepMockProxy<TransactionsRepository>;
  let auctionsService: DeepMockProxy<AuctionsService>;
  let stripeService: DeepMockProxy<StripeService>;
  const mockUserBalance = {
    total: 1000,
    available: 900,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionsRepository,
          useValue: mockDeep<TransactionsRepository>(),
        },
        { provide: AuctionsService, useValue: mockDeep<AuctionsService>() },
        { provide: StripeService, useValue: mockDeep<StripeService>() },
      ],
    }).compile();

    transactionsService = module.get(TransactionsService);
    transactionsRepository = module.get(TransactionsRepository);
    auctionsService = module.get(AuctionsService);
    stripeService = module.get(StripeService);
  });

  describe('topUp', () => {
    it('should top up a user balance', async () => {
      const amount = 100;
      const userId = MOCK_USER_ID;

      jest
        .spyOn(transactionsService, 'calculateBalance')
        .mockResolvedValue(mockUserBalance);

      await expect(transactionsService.topUp(amount, userId)).resolves.toEqual(
        mockUserBalance,
      );
      expect(transactionsRepository.create).toHaveBeenCalledWith({
        toId: userId,
        amount,
      });
      expect(transactionsService.calculateBalance).toHaveBeenCalledWith(userId);
    });
  });

  describe('withdraw', () => {
    it('should withdraw money from a user balance if available balance is enough', async () => {
      const amount = 100;
      const userData = {
        id: MOCK_USER_ID,
        role: Role.Admin,
        email: MOCK_EMAIL,
      };

      jest
        .spyOn(transactionsService, 'calculateBalance')
        .mockResolvedValue(mockUserBalance);

      await expect(
        transactionsService.withdraw(amount, userData),
      ).resolves.toEqual({
        available: mockUserBalance.available - amount,
        total: mockUserBalance.total - amount,
      });
      expect(transactionsRepository.create).toHaveBeenCalledWith({
        fromId: userData.id,
        amount,
      });
      expect(transactionsService.calculateBalance).toHaveBeenCalledWith(
        userData.id,
      );
      expect(stripeService.transferToAccount).not.toHaveBeenCalled();
    });

    it('should transfer money to a user stripe account if available balance is enough and user role is User', async () => {
      const amount = 100;
      const userData = {
        id: MOCK_USER_ID,
        role: Role.User,
        email: MOCK_EMAIL,
      };

      jest
        .spyOn(transactionsService, 'calculateBalance')
        .mockResolvedValue(mockUserBalance);

      await expect(
        transactionsService.withdraw(amount, userData),
      ).resolves.toEqual({
        available: mockUserBalance.available - amount,
        total: mockUserBalance.total - amount,
      });
      expect(transactionsRepository.create).toHaveBeenCalledWith({
        fromId: userData.id,
        amount,
      });
      expect(transactionsService.calculateBalance).toHaveBeenCalledWith(
        userData.id,
      );
      expect(stripeService.transferToAccount).toHaveBeenCalledWith(
        amount,
        userData.id,
      );
    });

    it('should throw an BadRequestException if available balance is not enough', async () => {
      const amount = 2000;
      const userData = {
        id: MOCK_USER_ID,
        role: Role.User,
        email: MOCK_EMAIL,
      };

      jest
        .spyOn(transactionsService, 'calculateBalance')
        .mockResolvedValue(mockUserBalance);

      await expect(
        transactionsService.withdraw(amount, userData),
      ).rejects.toThrow(
        new BadRequestException({
          code: TransactionExceptionCode.INSUFFICIENT_BALANCE,
          message: 'Not enough balance',
        }),
      );
      expect(transactionsService.calculateBalance).toHaveBeenCalledWith(
        userData.id,
      );
      expect(transactionsRepository.create).not.toHaveBeenCalled();
      expect(stripeService.transferToAccount).not.toHaveBeenCalled();
    });
  });

  describe('transferMoneyFromWinnerToOwner', () => {
    it('should transfer money from winner to owner on auction finished event', async () => {
      const auctionFinishedEvent = {
        winnerId: 'winner_id',
        sellerId: 'seller_id',
        highestBid: 150,
      };

      jest.spyOn(transactionsService, 'createTransfer').mockImplementation();

      transactionsService.transferMoneyFromWinnerToOwner(
        auctionFinishedEvent as any,
      );
      expect(transactionsService.createTransfer).toHaveBeenCalledWith({
        fromId: auctionFinishedEvent.winnerId,
        toId: auctionFinishedEvent.sellerId,
        amount: auctionFinishedEvent.highestBid,
      });
    });
  });

  describe('createTransfer', () => {
    it('should create a transfer if sender has enough balance', async () => {
      const SYSTEM_FEE = 0.1;
      const mockTransfer = {
        fromId: 'from_id',
        toId: 'to_id',
        amount: 100,
      };
      const mockTransactionResult = {
        id: 'mock_id',
        to_id: mockTransfer.toId,
        from_id: mockTransfer.fromId,
        amount: new Prisma.Decimal(mockTransfer.amount),
        fee: new Prisma.Decimal(mockTransfer.amount * SYSTEM_FEE),
        created_at: MOCK_DATE,
      };

      jest
        .spyOn(transactionsService, 'calculateBalance')
        .mockResolvedValue(mockUserBalance);
      transactionsRepository.create.mockResolvedValue(mockTransactionResult);

      await expect(
        transactionsService.createTransfer(mockTransfer),
      ).resolves.toEqual(mockTransactionResult);
      expect(transactionsService.calculateBalance).toHaveBeenCalledWith(
        mockTransfer.fromId,
      );
      const expectedSystemFee = mockTransfer.amount * SYSTEM_FEE;
      expect(transactionsRepository.create).toHaveBeenCalledWith({
        fromId: mockTransfer.fromId,
        toId: mockTransfer.toId,
        amount: mockTransfer.amount - expectedSystemFee,
        fee: expectedSystemFee,
      });
    });

    it('should throw an BadRequestException if sender does not have enough balance', async () => {
      const mockTransfer = {
        fromId: 'from_id',
        toId: 'to_id',
        amount: 1000,
      };

      jest
        .spyOn(transactionsService, 'calculateBalance')
        .mockResolvedValue(mockUserBalance);

      await expect(
        transactionsService.createTransfer(mockTransfer),
      ).rejects.toThrow(
        new BadRequestException({
          code: TransactionExceptionCode.INSUFFICIENT_BALANCE,
          message: 'Not enough balance',
        }),
      );
      expect(transactionsService.calculateBalance).toHaveBeenCalledWith(
        mockTransfer.fromId,
      );
      expect(transactionsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('calculateBalance', () => {
    it('should calculate user total and available balance', async () => {
      const mockAuctions = {
        data: [
          {
            highest_bid: 100,
          },
        ],
        info: {
          page: 1,
          totalPages: 1,
          totalCount: 1,
        },
      };
      const mockTransactions = [
        {
          from_id: MOCK_USER_ID,
          to_id: 'another_user_id',
          amount: new Prisma.Decimal(100),
          id: 'transaction_id1',
          fee: new Prisma.Decimal(10),
          created_at: MOCK_DATE,
        },
        {
          from_id: null,
          to_id: MOCK_USER_ID,
          amount: new Prisma.Decimal(200),
          id: 'transaction_id2',
          fee: null,
          created_at: MOCK_DATE,
        },
        {
          from_id: 'another_user_id',
          to_id: MOCK_USER_ID,
          amount: new Prisma.Decimal(54),
          id: 'transaction_id3',
          fee: new Prisma.Decimal(6),
          created_at: MOCK_DATE,
        },
      ];
      auctionsService.findAll.mockResolvedValue(mockAuctions as any);
      transactionsRepository.findAll.mockResolvedValue(mockTransactions);

      const freezedBalance = mockAuctions.data[0].highest_bid;
      const expectedIncome = 200 + 54;
      const expectedExpense = 100 + 10;
      await expect(
        transactionsService.calculateBalance(MOCK_USER_ID),
      ).resolves.toEqual({
        total: expectedIncome - expectedExpense,
        available: expectedIncome - expectedExpense - freezedBalance,
      });
      expect(auctionsService.findAll).toHaveBeenCalledWith({
        participantId: MOCK_USER_ID,
        isCompleted: false,
        isUserLeader: true,
        page: 1,
      });
      expect(transactionsRepository.findAll).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  describe('calculateTotalFeeAmount', () => {
    it('should calculate total fee amount', async () => {
      const mockTotalFeeAmount = {
        _sum: {
          fee: new Prisma.Decimal(100),
        },
      };

      transactionsRepository.calculateFee.mockResolvedValue(mockTotalFeeAmount);
      await expect(
        transactionsService.calculateTotalFeeAmount(),
      ).resolves.toEqual({
        totalFeeAmount: 100,
      });
    });
  });
});
