import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBidType } from './types/create-bid.type';

@Injectable()
export class BidsRepository {
  constructor(private prisma: PrismaService) {}

  create(createBidData: CreateBidType) {
    return this.prisma.bids.create({
      data: {
        user_id: createBidData.userId,
        auction_id: createBidData.auctionId,
        bid_amount: createBidData.bidAmount,
      },
    });
  }
}
