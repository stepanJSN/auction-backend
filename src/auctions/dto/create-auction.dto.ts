import { IsDate, IsInt, IsUUID } from 'class-validator';

export class CreateAuctionDto {
  @IsUUID()
  cardId: string;

  @IsInt()
  startingBid: number;

  @IsInt()
  minBidStep: number;

  @IsInt()
  maxBid: number;

  @IsInt()
  minLength: number;

  @IsDate()
  maxLength: Date;
}
