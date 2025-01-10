import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsUUID } from 'class-validator';

export class CreateAuctionDto {
  @IsUUID()
  cardId: string;

  @IsInt()
  startingBid: number;

  @IsInt()
  minBidStep: number;

  @IsOptional()
  @IsInt()
  maxBid: number;

  @IsInt()
  minLength: number;

  @Type(() => Date)
  @IsDate()
  endTime: Date;
}
