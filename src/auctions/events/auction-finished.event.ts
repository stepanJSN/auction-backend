export class AuctionsFinishedEvent {
  id: string;
  constructor(payload: { id: string }) {
    this.id = payload.id;
  }
}
