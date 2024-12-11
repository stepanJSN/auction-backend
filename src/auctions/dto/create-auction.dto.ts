import { IsDecimal, IsUUID } from 'class-validator';

export class CreateAuctionDto {
  @IsUUID()
  cardInstanceId: string;

  @IsDecimal()
  starting_bid: number;

  @IsDecimal()
  min_bid_step: number;

  @IsDecimal()
  max_bid: number;

  @IsInt()
  min_length: number;

  @IsInt()
  max_length: Date;

  @IsUUID()
  createdBy: string;
}
