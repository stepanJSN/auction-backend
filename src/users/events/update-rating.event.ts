export enum RatingAction {
  INCREASE = 'increase',
  DECREASE = 'decrease',
}

export class UpdateRatingEvent {
  userId: string;
  pointsAmount: number;
  action: RatingAction;
  constructor(data: {
    userId: string;
    pointsAmount: number;
    action: RatingAction;
  }) {
    Object.assign(this, data);
  }
}
