import { IsInt, IsUUID } from 'class-validator';

export class CreateBidDto {
  @IsUUID()
  auctionId: string;

  @IsInt()
  bidAmount: number;
}
