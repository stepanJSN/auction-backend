import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionRepositoryType } from './types/create-transaction-repository.type';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsRepository {
  constructor(private prisma: PrismaService) {}
  create(createTransaction: CreateTransactionRepositoryType) {
    return this.prisma.transactions.create({
      data: {
        from_id: createTransaction.fromId,
        to_id: createTransaction.toId,
        amount: new Prisma.Decimal(createTransaction.amount),
        fee: createTransaction.fee
          ? new Prisma.Decimal(createTransaction.fee)
          : undefined,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.transactions.findMany({
      where: {
        OR: [{ from_id: userId }, { to_id: userId }],
      },
    });
  }
}
