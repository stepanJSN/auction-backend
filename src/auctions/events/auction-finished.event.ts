export class AuctionsFinishedEvent {
  id: string;
  winnerId: string;
  sellerId: string;
  cardInstanceId: string;
  constructor(payload: {
    id: string;
    winnerId: string;
    sellerId: string;
    cardInstanceId: string;
  }) {
    this.id = payload.id;
    this.cardInstanceId = payload.cardInstanceId;
    this.winnerId = payload.winnerId;
    this.sellerId = payload.sellerId;
  }
}
