import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

const EXCHANGE_RATE = 1.2;

@Injectable()
export class StripeService {
  private readonly stripeKey: string;
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripeKey = this.configService.get<string>('stripe_key');
    this.stripe = new Stripe(this.stripeKey);
  }

  async createPaymentIntent(numberOfPoints: number) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: +(numberOfPoints * EXCHANGE_RATE * 100).toFixed(0),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }
}
