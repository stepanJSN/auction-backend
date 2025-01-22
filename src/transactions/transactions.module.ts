import { forwardRef, Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsRepository } from './transactions.repository';
import { AuctionsModule } from 'src/auctions/auctions.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [AuctionsModule, forwardRef(() => StripeModule)],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRepository],
  exports: [TransactionsService],
})
export class TransactionsModule {}
