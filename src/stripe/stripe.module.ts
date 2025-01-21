import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { SystemModule } from 'src/system/system.module';

@Module({
  imports: [TransactionsModule, SystemModule],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
