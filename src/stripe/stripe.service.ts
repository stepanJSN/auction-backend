import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemService } from 'src/system/system.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripeKey: string;
  private readonly stripe: Stripe;
  private readonly stripeWebhookSecret: string;

  constructor(
    private configService: ConfigService,
    private transactionsService: TransactionsService,
    private systemService: SystemService,
  ) {
    this.stripeKey = this.configService.get<string>('stripe_key');
    this.stripe = new Stripe(this.stripeKey);
    this.stripeWebhookSecret = this.configService.get<string>(
      'stripe_webhook_secret',
    );
  }

  async createPaymentIntent(numberOfPoints: number, userId: string) {
    const exchangeRate = (await this.systemService.findExchangeRate())
      .exchange_rate;
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: +(numberOfPoints * exchangeRate * 100).toFixed(0),
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
        this.transactionsService.topUp({
          userId: paymentIntent.metadata.userId,
          amount: +paymentIntent.metadata.numberOfPoints,
        });
        break;
      default:
        break;
    }
  }

  async createAccount() {
    const account = await this.stripe.accounts.create({
      controller: {
        losses: {
          payments: 'application',
        },
        fees: {
          payer: 'application',
        },
        stripe_dashboard: {
          type: 'express',
        },
      },
    });

    return account.id;
  }

  async createAccountLink() {
    const accountId = await this.createAccount();
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'http://localhost:5173/transactions',
      return_url: 'http://localhost:5173/transactions',
      type: 'account_onboarding',
    });

    return accountLink.url;
  }
}
