import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { users } from '@prisma/client';
import { SystemService } from 'src/system/system.service';
import { TransactionExceptionCode } from 'src/transactions/transactions-exceptions.enum';
import { TransactionsService } from 'src/transactions/transactions.service';
import { UsersService } from 'src/users/users.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripeKey: string;
  private readonly stripe: Stripe;
  private readonly stripeWebhookSecret: string;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => TransactionsService))
    private transactionsService: TransactionsService,
    private systemService: SystemService,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
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
        this.transactionsService.topUp(
          +paymentIntent.metadata.numberOfPoints,
          paymentIntent.metadata.userId,
        );
        break;
      default:
        break;
    }
  }

  async createAccount(userData: Omit<users, 'password' | 'stripe_account_id'>) {
    const account = await this.stripe.accounts.create({
      email: userData.email,
      business_type: 'individual',
      individual: {
        first_name: userData.name,
        last_name: userData.surname,
        email: userData.email,
      },
      business_profile: {
        product_description: 'Platform customer',
        url: '',
      },
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

  async createAccountLink(userId: string) {
    const clientUrl = this.configService.get<string>('client_url');
    const redirectUrl = clientUrl + '/transactions';

    const { stripe_account_id, ...restData } =
      await this.userService.findOneById(userId);
    const accountId = stripe_account_id ?? (await this.createAccount(restData));
    if (!stripe_account_id) {
      this.userService.update(userId, { stripe_account_id: accountId });
    }
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: redirectUrl,
      return_url: redirectUrl,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  async transferToAccount(amount: number, userId: string) {
    const { stripe_account_id } = await this.userService.findOneById(userId);

    if (!stripe_account_id) {
      throw new NotFoundException('Stripe account not found');
    }

    const { charges_enabled } =
      await this.stripe.accounts.retrieve(stripe_account_id);

    if (!charges_enabled) {
      throw new BadRequestException({
        code: TransactionExceptionCode.STRIPE_ACCOUNT_NOT_COMPLETED,
        message: 'You don`t complete stripe account registration',
      });
    }

    try {
      await this.stripe.transfers.create({
        amount: +(amount * 100).toFixed(0),
        currency: 'usd',
        destination: stripe_account_id,
      });
    } catch (error) {
      console.error(error);
      throw new Error('Transfer failed');
    }
  }
}
