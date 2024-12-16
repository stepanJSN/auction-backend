export enum RatingAction {
  INCREASE = 'increase',
  DECREASE = 'decrease',
}

export class UpdateRatingEvent {
  constructor(
    public userId: string,
    public pointsAmount: number,
    public action: RatingAction,
  ) {}
}
