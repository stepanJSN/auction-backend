import { forwardRef, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { SystemModule } from 'src/system/system.module';
import { UsersModule } from 'src/users/users.module';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    forwardRef(() => TransactionsModule),
    SystemModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [StripeController],
  providers: [
    StripeService,
    {
      inject: [ConfigService],
      provide: Stripe,
      useFactory: (configService: ConfigService) => {
        return new Stripe(configService.get<string>('stripe_key'));
      },
    },
  ],
  exports: [StripeService],
})
export class StripeModule {}
