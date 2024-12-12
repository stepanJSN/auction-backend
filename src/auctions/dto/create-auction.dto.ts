import { IsDate, IsInt, IsUUID } from 'class-validator';

export class CreateAuctionDto {
  @IsUUID()
  cardId: string;

  @IsInt()
  starting_bid: number;

  @IsInt()
  min_bid_step: number;

  @IsInt()
  max_bid: number;

  @IsInt()
  min_length: number;

  @IsDate()
  max_length: Date;
}
