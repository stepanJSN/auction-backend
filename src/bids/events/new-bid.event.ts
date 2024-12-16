export class NewBidEvent {
  auctionId: string;
  bidAmount: number;
  createdAt: Date;
  constructor(payload: {
    auctionId: string;
    bidAmount: number;
    createdAt: Date;
  }) {
    this.auctionId = payload.auctionId;
    this.bidAmount = payload.bidAmount;
    this.createdAt = payload.createdAt;
  }
}
