export class SetEventPayload {
  bonus: number;
  cardsId: string[];
  constructor(data: { bonus: number; cardsId: string[] }) {
    Object.assign(this, data);
  }
}
