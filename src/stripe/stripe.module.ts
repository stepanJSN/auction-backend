import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
