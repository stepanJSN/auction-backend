import { BadRequestException, Injectable } from '@nestjs/common';
import { BidsRepository } from './bids.repository';
import { CreateBidType } from './types/create-bid.type';
import { AuctionsService } from 'src/auctions/auctions.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewBidEvent } from './events/new-bid.event';

@Injectable()
export class BidsService {
  constructor(
    private bidsRepository: BidsRepository,
    private auctionsService: AuctionsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createBidData: CreateBidType) {
    const auction = await this.auctionsService.findOne(
      createBidData.auctionId,
      createBidData.userId,
    );

    if (!auction) {
      throw new BadRequestException('The auction not found!');
    }

    if (auction.is_completed) {
      throw new BadRequestException('The auction has already ended!');
    }

    if (auction.card.isUserHasThisCard) {
      throw new BadRequestException('You already have this card!');
    }

    if (
      !auction.highestBid.amount &&
      auction.starting_bid > createBidData.bidAmount
    ) {
      throw new BadRequestException('You cannot bid less than starting bid!');
    }

    if (auction.max_bid && auction.max_bid < createBidData.bidAmount) {
      throw new BadRequestException('Your bid exceeds the maximum allowed!');
    }

    if (
      auction.min_bid_step >
      createBidData.bidAmount -
        (auction.highestBid.amount ?? auction.starting_bid)
    ) {
      throw new BadRequestException(
        'Your bid does not exceed the minimum bid step!',
      );
    }

    const { created_at, bid_amount, auction_id } =
      await this.bidsRepository.create(createBidData);
    this.eventEmitter.emit(
      'bid.new',
      new NewBidEvent({
        createdAt: created_at,
        bidAmount: bid_amount,
        auctionId: auction_id,
      }),
    );
  }
}
