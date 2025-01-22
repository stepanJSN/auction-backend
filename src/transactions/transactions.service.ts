import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransferType } from './types/create-transfer.type';
import { AuctionsService } from 'src/auctions/auctions.service';
import { OnEvent } from '@nestjs/event-emitter';
import { AuctionEvent } from 'src/auctions/enums/auction-event.enum';
import { AuctionsFinishedEvent } from 'src/auctions/events/auction-finished.event';
import { StripeService } from 'src/stripe/stripe.service';
import { JWTPayload } from 'src/auth/types/auth.type';
import { Role } from '@prisma/client';
import { TransactionExceptionCode } from './transactions-exceptions.enum';

const SYSTEM_FEE = 0.1;

@Injectable()
export class TransactionsService {
  constructor(
    private transactionsRepository: TransactionsRepository,
    private auctionsService: AuctionsService,
    @Inject(forwardRef(() => StripeService))
    private stripeService: StripeService,
  ) {}

  async topUp(amount: number, userId: string) {
    await this.transactionsRepository.create({
      toId: userId,
      amount,
    });
    return this.calculateBalance(userId);
  }

  async withdraw(amount: number, userData: JWTPayload) {
    const { available } = await this.calculateBalance(userData.id);
    if (available < amount) {
      throw new BadRequestException({
        code: TransactionExceptionCode.INSUFFICIENT_BALANCE,
        message: 'Not enough balance',
      });
    }

    if (userData.role === Role.User) {
      await this.stripeService.transferToAccount(amount, userData.id);
    }

    await this.transactionsRepository.create({
      fromId: userData.id,
      amount,
    });

    return this.calculateBalance(userData.id);
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

  calculateSystemFee(amount: number) {
    return amount * SYSTEM_FEE;
  }

  async createTransfer({ fromId, toId, amount }: CreateTransferType) {
    const { available } = await this.calculateBalance(fromId);
    if (available < amount) {
      throw new Error('Not enough balance');
    }

    const systemFee = this.calculateSystemFee(amount);
    const amountWithoutFee = amount - systemFee;

    return this.transactionsRepository.create({
      fromId,
      toId,
      amount: amountWithoutFee,
      fee: systemFee,
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
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount.toFixed(2)),
        0,
      );

    const expense = transactions
      .filter((transaction) => transaction.from_id === userId)
      .reduce(
        (sum, transaction) =>
          sum +
          Number(transaction.amount.toFixed(2)) +
          (transaction.fee ? Number(transaction.fee.toFixed(2)) : 0),
        0,
      );

    return {
      total: income - expense,
      available: income - expense - freezedBalance,
    };
  }

  async calculateFee() {
    const sum = await this.transactionsRepository.calculateFee();
    return { totalFeeAmount: +sum._sum.fee.toFixed(2) };
  }
}
