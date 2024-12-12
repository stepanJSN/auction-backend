import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuctionsRepository } from './auctions.repository';
import { AuctionsService } from './auctions.service';

@Injectable()
export class AuctionsCronService {
  constructor(
    private readonly auctionRepository: AuctionsRepository,
    private readonly auctionService: AuctionsService,
  ) {}

  @Cron('*/1 * * * *')
  async checkExpiredAuctions() {
    const expiredAuctions = await this.auctionRepository.findFinishedByNow();

    for (const auction of expiredAuctions) {
      await this.auctionService.finishAuction(auction.id);
    }
  }
}
