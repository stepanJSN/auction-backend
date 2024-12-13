export class AuctionChangedEndTimeEvent {
  id: string;
  endTime: Date;
  constructor(payload: { id: string; endTime: Date }) {
    this.id = payload.id;
    this.endTime = payload.endTime;
  }
}
