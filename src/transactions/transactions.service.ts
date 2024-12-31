import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransferType } from './types/create-transfer.type';
import { CreateTransactionServiceType } from './types/create-transaction-service.type';
import { AuctionsService } from 'src/auctions/auctions.service';
import { OnEvent } from '@nestjs/event-emitter';
import { AuctionEvent } from 'src/auctions/enums/auction-event.enum';
import { AuctionsFinishedEvent } from 'src/auctions/events/auction-finished.event';

@Injectable()
export class TransactionsService {
  constructor(
    private transactionsRepository: TransactionsRepository,
    private auctionsService: AuctionsService,
  ) {}

  async topUp(createTransaction: CreateTransactionServiceType) {
    await this.transactionsRepository.create({
      toId: createTransaction.userId,
      amount: createTransaction.amount,
    });
    return this.calculateBalance(createTransaction.userId);
  }

  async withdraw(createTransaction: CreateTransactionServiceType) {
    const { available } = await this.calculateBalance(createTransaction.userId);
    if (available < createTransaction.amount) {
      throw new BadRequestException('Not enough balance');
    }

    await this.transactionsRepository.create({
      fromId: createTransaction.userId,
      amount: createTransaction.amount,
    });

    return this.calculateBalance(createTransaction.userId);
  }

  @OnEvent(AuctionEvent.FINISHED)
  transferMoneyFromWinnerToOwner({
    winnerId,
    sellerId,
    highestBid,
  }: AuctionsFinishedEvent) {
    this.createTransfer({
      fromId: winnerId,
      toId: sellerId,
      amount: highestBid,
    });
  }

  async createTransfer({ fromId, toId, amount }: CreateTransferType) {
    const { available } = await this.calculateBalance(fromId);
    if (available < amount) {
      throw new Error('Not enough balance');
    }

    return this.transactionsRepository.create({
      fromId,
      toId,
      amount,
    });
  }

  async calculateBalance(userId: string) {
    let freezedBalance = 0;
    let currentPage = 1;
    while (true) {
      const { data: auctions, info } = await this.auctionsService.findAll({
        participantId: userId,
        isCompleted: false,
        isUserLeader: true,
        page: currentPage,
      });

      auctions.forEach((auction) => {
        freezedBalance += auction.highest_bid;
      });

      if (currentPage >= info.totalPages) break;
      currentPage++;
    }

    const transactions = await this.transactionsRepository.findAll(userId);
    const income = transactions
      .filter((transaction) => transaction.to_id === userId)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const expense = transactions
      .filter((transaction) => transaction.from_id === userId)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return {
      total: income - expense,
      available: income - expense - freezedBalance,
    };
  }
}
