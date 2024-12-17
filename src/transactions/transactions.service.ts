import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransferType } from './types/create-transfer.type';

@Injectable()
export class TransactionsService {
  constructor(private transactionsRepository: TransactionsRepository) {}

  toUp(createTransactionDto: CreateTransactionDto) {
    return this.transactionsRepository.create({
      toId: createTransactionDto.userId,
      amount: createTransactionDto.amount,
    });
  }

  async withdraw(createTransactionDto: CreateTransactionDto) {
    const currentBalance = await this.calculateBalance(
      createTransactionDto.userId,
    );
    if (currentBalance < createTransactionDto.amount) {
      throw new BadRequestException('Not enough balance');
    }

    return this.transactionsRepository.create({
      fromId: createTransactionDto.userId,
      amount: createTransactionDto.amount,
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
