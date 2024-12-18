export class SetEventPayload {
  bonus: number;
  cardsId: string[];
  constructor(data: { bonus: number; cardsId: string[] }) {
    Object.assign(this, data);
  }
}

export enum SetAction {
  CREATE = 'set.create',
  UPDATE = 'set.update',
  REMOVE = 'set.remove',
}
