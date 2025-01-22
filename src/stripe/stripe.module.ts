import { forwardRef, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { SystemModule } from 'src/system/system.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    forwardRef(() => TransactionsModule),
    SystemModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
