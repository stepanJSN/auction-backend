export class AuctionsFinishedEvent {
  id: string;
  winnerId: string;
  sellerId: string;
  cardInstanceId: string;
  highestBid: number;
  constructor(payload: {
    id: string;
    winnerId: string;
    sellerId: string;
    cardInstanceId: string;
    highestBid: number;
  }) {
    this.id = payload.id;
    this.cardInstanceId = payload.cardInstanceId;
    this.winnerId = payload.winnerId;
    this.sellerId = payload.sellerId;
    this.highestBid = payload.highestBid;
  }
}
