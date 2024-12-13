import { UpdateAuctionDto } from '../dto/update-auction.dto';

export class AuctionChangedEvent {
  id: string;
  startingBid?: number;
  minBidStep?: number;
  maxBid?: number;
  minLength?: number;
  endTime?: Date;

  constructor(data: UpdateAuctionDto & { id: string }) {
    Object.assign(this, data);
  }
}
