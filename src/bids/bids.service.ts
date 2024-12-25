import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BidsRepository } from './bids.repository';
import { CreateBidType } from './types/create-bid.type';
import { AuctionsService } from 'src/auctions/auctions.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewBidEvent } from './events/new-bid.event';
import { BidExceptionCode } from './enums/bid-exception.enum';
import { TransactionsService } from 'src/transactions/transactions.service';
import { BidEvent } from './enums/bid-event.enum';

@Injectable()
export class BidsService {
  constructor(
    private bidsRepository: BidsRepository,
    private auctionsService: AuctionsService,
    private eventEmitter: EventEmitter2,
    private transactionsService: TransactionsService,
  ) {}

  async create(createBidData: CreateBidType) {
    const auction = await this.auctionsService.findOne(
      createBidData.auctionId,
      createBidData.userId,
    );

    if (!auction) {
      throw new NotFoundException({
        code: BidExceptionCode.AUCTION_NOT_FOUND,
        message: 'The auction not found!',
      });
    }

    if (auction.is_completed) {
      throw new BadRequestException({
        code: BidExceptionCode.AUCTION_COMPLETED,
        message: 'The auction has already ended!',
      });
    }

    if (auction.card.isUserHasThisCard) {
      throw new BadRequestException({
        code: BidExceptionCode.USER_ALREADY_HAS_CARD,
        message: 'You already have this card!',
      });
    }

    const { available } = await this.transactionsService.calculateBalance(
      createBidData.userId,
    );
    if (available < createBidData.bidAmount) {
      throw new BadRequestException({
        code: BidExceptionCode.INSUFFICIENT_BALANCE,
        message: 'You do not have enough money to make this bid!',
      });
    }

    if (
      !auction.highestBid.amount &&
      auction.starting_bid > createBidData.bidAmount
    ) {
      throw new BadRequestException({
        code: BidExceptionCode.BID_BELOW_STARTING,
        message: 'You cannot bid less than starting bid!',
      });
    }

    if (auction.max_bid && auction.max_bid < createBidData.bidAmount) {
      throw new BadRequestException({
        code: BidExceptionCode.BID_EXCEEDS_MAX,
        message: 'Your bid exceeds the maximum allowed!',
      });
    }

    if (
      auction.highestBid.amount &&
      auction.min_bid_step > createBidData.bidAmount - auction.highestBid.amount
    ) {
      throw new BadRequestException({
        code: BidExceptionCode.BID_NOT_EXCEEDS_MINIMUM_STEP,
        message: 'Your bid does not exceed the minimum bid step!',
      });
    }

    const { created_at, bid_amount, auction_id } =
      await this.bidsRepository.create(createBidData);
    this.eventEmitter.emit(
      BidEvent.NEW,
      new NewBidEvent({
        createdAt: created_at,
        bidAmount: bid_amount,
        auctionId: auction_id,
      }),
    );
  }
}
