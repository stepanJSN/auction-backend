import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransferType } from './types/create-transfer.type';
import { CreateTransactionServiceType } from './types/create-transaction-service.type';

@Injectable()
export class TransactionsService {
  constructor(private transactionsRepository: TransactionsRepository) {}

  toUp(createTransaction: CreateTransactionServiceType) {
    return this.transactionsRepository.create({
      toId: createTransaction.userId,
      amount: createTransaction.amount,
    });
  }

  async withdraw(createTransaction: CreateTransactionServiceType) {
    const currentBalance = await this.calculateBalance(
      createTransaction.userId,
    );
    if (currentBalance < createTransaction.amount) {
      throw new BadRequestException('Not enough balance');
    }

    return this.transactionsRepository.create({
      fromId: createTransaction.userId,
      amount: createTransaction.amount,
    });
  }

  async createTransfer({ fromId, toId, amount }: CreateTransferType) {
    const currentBalance = await this.calculateBalance(fromId);
    if (currentBalance < amount) {
      throw new Error('Not enough balance');
    }

    return this.transactionsRepository.create({
      fromId,
      toId,
      amount,
    });
  }

  async calculateBalance(userId: string) {
    const transactions = await this.transactionsRepository.findAll(userId);
    const income = transactions
      .filter((transaction) => transaction.to_id === userId)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const expense = transactions
      .filter((transaction) => transaction.from_id === userId)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return income - expense;
  }
}
