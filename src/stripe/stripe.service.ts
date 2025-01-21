import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

const EXCHANGE_RATE = 1.2;

@Injectable()
export class StripeService {
  private readonly stripeKey: string;
  private readonly stripe: Stripe;
  private readonly stripeWebhookSecret: string;

  constructor(private configService: ConfigService) {
    this.stripeKey = this.configService.get<string>('stripe_key');
    this.stripe = new Stripe(this.stripeKey);
    this.stripeWebhookSecret = this.configService.get<string>(
      'stripe_webhook_secret',
    );
  }

  async createPaymentIntent(numberOfPoints: number, userId: string) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: +(numberOfPoints * EXCHANGE_RATE * 100).toFixed(0),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId,
        numberOfPoints,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  async handleWebhookEvent(rawBody: string | Buffer, signature: string) {
    let event: Stripe.Event;
    if (this.stripeWebhookSecret) {
      try {
        event = this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          this.stripeWebhookSecret,
        );
      } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        throw new BadRequestException(`Webhook signature verification failed.`);
      }
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(
          `PaymentIntent for ${paymentIntent.amount} was successful!`,
          paymentIntent.metadata.userId,
          paymentIntent.metadata.numberOfPoints,
        );
        break;
      default:
        console.log(`Unhandled event type ${event.type}.`);
    }
  }
}
