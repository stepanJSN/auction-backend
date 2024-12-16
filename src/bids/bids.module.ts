import { Module } from '@nestjs/common';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { BidsRepository } from './bids.repository';
import { AuctionsModule } from 'src/auctions/auctions.module';

@Module({
  imports: [AuctionsModule],
  controllers: [BidsController],
  providers: [BidsService, BidsRepository],
})
export class BidsModule {}
