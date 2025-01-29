import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionsRepository } from './transactions.repository';
import { MOCK_DATE, MOCK_USER_ID } from 'config/mock-test-data';
import { Prisma } from '@prisma/client';

describe('TransactionsRepository', () => {
  let transactionsRepository: TransactionsRepository;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TransactionsRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    transactionsRepository = module.get(TransactionsRepository);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    const createTransactionRepositoryDto = {
      fromId: 'test_from_id',
      toId: 'test_to_id',
      amount: 100,
    };
    it('should create a new transaction with fee if provided', async () => {
      const createTransactionRepositoryDtoWithFee = {
        ...createTransactionRepositoryDto,
        fee: 1.1,
      };
      const mockTransaction = {
        id: 'test_id',
        from_id: createTransactionRepositoryDtoWithFee.fromId,
        to_id: createTransactionRepositoryDtoWithFee.toId,
        amount: new Prisma.Decimal(
          createTransactionRepositoryDtoWithFee.amount,
        ),
        fee: new Prisma.Decimal(createTransactionRepositoryDtoWithFee.fee),
        created_at: MOCK_DATE,
      };

      prisma.transactions.create.mockResolvedValue(mockTransaction);
      await expect(
        transactionsRepository.create(createTransactionRepositoryDtoWithFee),
      ).resolves.toEqual(mockTransaction);

      expect(prisma.transactions.create).toHaveBeenCalledWith({
        data: {
          from_id: createTransactionRepositoryDtoWithFee.fromId,
          to_id: createTransactionRepositoryDtoWithFee.toId,
          amount: new Prisma.Decimal(createTransactionRepositoryDto.amount),
          fee: new Prisma.Decimal(createTransactionRepositoryDtoWithFee.fee),
        },
      });
    });

    it('should create a new transaction without fee if not provided', async () => {
      const mockTransaction = {
        id: 'test_id',
        from_id: createTransactionRepositoryDto.fromId,
        to_id: createTransactionRepositoryDto.toId,
        amount: new Prisma.Decimal(createTransactionRepositoryDto.amount),
        fee: null,
        created_at: MOCK_DATE,
      };

      prisma.transactions.create.mockResolvedValue(mockTransaction);
      await expect(
        transactionsRepository.create(createTransactionRepositoryDto),
      ).resolves.toEqual(mockTransaction);

      expect(prisma.transactions.create).toHaveBeenCalledWith({
        data: {
          from_id: createTransactionRepositoryDto.fromId,
          to_id: createTransactionRepositoryDto.toId,
          amount: new Prisma.Decimal(createTransactionRepositoryDto.amount),
          fee: undefined,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should find all transactions for a user', async () => {
      const userId = MOCK_USER_ID;
      const mockTransactions = [
        {
          id: 'test_id1',
          from_id: userId,
          to_id: 'another_user_id',
          amount: new Prisma.Decimal(100),
          fee: new Prisma.Decimal(1.1),
          created_at: MOCK_DATE,
        },
        {
          id: 'test_id1',
          from_id: 'another_user_id',
          to_id: userId,
          amount: new Prisma.Decimal(100),
          fee: new Prisma.Decimal(1.1),
          created_at: MOCK_DATE,
        },
      ];

      prisma.transactions.findMany.mockResolvedValue(mockTransactions);
      await expect(transactionsRepository.findAll(userId)).resolves.toEqual(
        mockTransactions,
      );
      expect(prisma.transactions.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ from_id: userId }, { to_id: userId }],
        },
      });
    });
  });

  describe('calculateFee', () => {
    it('should calculate the fee amount for all transactions', async () => {
      const mockFeeAmount = {
        _sum: {
          fee: new Prisma.Decimal(100),
        },
      };

      prisma.transactions.aggregate.mockResolvedValue(mockFeeAmount as any);
      await expect(transactionsRepository.calculateFee()).resolves.toEqual(
        mockFeeAmount,
      );
      expect(prisma.transactions.aggregate).toHaveBeenCalledWith({
        _sum: {
          fee: true,
        },
      });
    });
  });
});
