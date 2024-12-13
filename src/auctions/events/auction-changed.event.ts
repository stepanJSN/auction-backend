import { UpdateAuctionDto } from '../dto/update-auction.dto';

export class AuctionChangedEvent extends UpdateAuctionDto {
  id: string;

  constructor(payload: UpdateAuctionDto & { id: string }) {
    super();
    this.id = payload.id;
  }
}
