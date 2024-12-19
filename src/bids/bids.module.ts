import { Module } from '@nestjs/common';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { BidsRepository } from './bids.repository';
import { AuctionsModule } from 'src/auctions/auctions.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [AuctionsModule, TransactionsModule],
  controllers: [BidsController],
  providers: [BidsService, BidsRepository],
})
export class BidsModule {}
