import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { SystemService } from 'src/system/system.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { UsersService } from 'src/users/users.service';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { MOCK_DATE, MOCK_EMAIL, MOCK_USER_ID } from 'config/mock-test-data';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionExceptionCode } from 'src/transactions/transactions-exceptions.enum';

describe('StripeService', () => {
  let stripeService: StripeService;
  let transactionsService: DeepMockProxy<TransactionsService>;
  let systemService: DeepMockProxy<SystemService>;
  let userService: DeepMockProxy<UsersService>;
  let stripe: DeepMockProxy<Stripe>;
  const stripeKey = 'key';
  const stripeWebhookSecret = 'secret';
  const clientUrl = 'clientUrl';

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: TransactionsService,
          useValue: mockDeep<TransactionsService>(),
        },
        { provide: SystemService, useValue: mockDeep<SystemService>() },
        { provide: UsersService, useValue: mockDeep<UsersService>() },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'stripe_key':
                  return stripeKey;
                case 'stripe_webhook_secret':
                  return stripeWebhookSecret;
                case 'client_url':
                  return clientUrl;
                default:
                  return null;
              }
            }),
          },
        },
        { provide: Stripe, useValue: mockDeep<Stripe>() },
      ],
    }).compile();

    stripeService = module.get(StripeService);
    transactionsService = module.get(TransactionsService);
    systemService = module.get(SystemService);
    userService = module.get(UsersService);
    stripe = module.get(Stripe);
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      const userId = MOCK_USER_ID;
      const numberOfPoints = 10;
      const clientSecret = 'clientSecret';
      const mockExchangeRate = 1.2;

      systemService.findExchangeRate.mockResolvedValue({
        exchange_rate: mockExchangeRate,
        updated_at: MOCK_DATE,
      });
      stripe.paymentIntents.create.mockResolvedValue({
        client_secret: clientSecret,
      } as any);

      const result = await stripeService.createPaymentIntent(
        numberOfPoints,
        userId,
      );

      expect(systemService.findExchangeRate).toHaveBeenCalled();
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1200,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId,
          numberOfPoints,
        },
      });
      expect(result).toEqual({ clientSecret });
    });
  });

  describe('handleWebhookEvent', () => {
    it('should handle a successful payment', async () => {
      const rawBody = 'rawBody';
      const signature = 'signature';
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            metadata: {
              userId: MOCK_USER_ID,
              numberOfPoints: 10,
            },
          },
        },
      };

      stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);

      await stripeService.handleWebhookEvent(rawBody, signature);

      expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
        rawBody,
        signature,
        stripeWebhookSecret,
      );
      expect(transactionsService.topUp).toHaveBeenCalledWith(10, MOCK_USER_ID);
    });

    it('should throw a BadRequestException if webhook signature verification fails', async () => {
      const rawBody = 'rawBody';
      const signature = 'signature';

      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Verification failed');
      });

      await expect(
        stripeService.handleWebhookEvent(rawBody, signature),
      ).rejects.toThrow(
        new BadRequestException(`Webhook signature verification failed.`),
      );
    });
  });

  describe('createAccountLink', () => {
    it('should create a Stripe account link based on accountId if it already exists', async () => {
      const userId = MOCK_USER_ID;
      const mockAccountLinkUrl = 'accountLinkUrl';
      const mockUserData = {
        stripe_account_id: 'accountId',
      };

      userService.findOneById.mockResolvedValue(mockUserData as any);
      stripe.accountLinks.create.mockResolvedValue({
        url: mockAccountLinkUrl,
      } as any);

      const result = await stripeService.createAccountLink(userId);

      expect(userService.findOneById).toHaveBeenCalledWith(userId);
      expect(stripe.accountLinks.create).toHaveBeenCalledWith({
        account: mockUserData.stripe_account_id,
        refresh_url: `${clientUrl}/transactions`,
        return_url: `${clientUrl}/transactions`,
        type: 'account_onboarding',
      });
      expect(stripe.accounts.create).not.toHaveBeenCalled();
      expect(userService.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockAccountLinkUrl);
    });

    it('should create a Stripe account if it does not exist', async () => {
      const userId = MOCK_USER_ID;
      const mockAccountLinkUrl = 'accountLinkUrl';
      const mockNewAccountId = 'newAccountId';
      const mockUserData = {
        name: 'Test user',
        surname: 'Test surname',
        email: MOCK_EMAIL,
      };

      userService.findOneById.mockResolvedValue(mockUserData as any);
      stripe.accounts.create.mockResolvedValue({
        id: mockNewAccountId,
      } as any);
      stripe.accountLinks.create.mockResolvedValue({
        url: mockAccountLinkUrl,
      } as any);

      const result = await stripeService.createAccountLink(userId);

      expect(userService.findOneById).toHaveBeenCalledWith(userId);
      expect(stripe.accounts.create).toHaveBeenCalledWith({
        email: mockUserData.email,
        business_type: 'individual',
        individual: {
          first_name: mockUserData.name,
          last_name: mockUserData.surname,
          email: mockUserData.email,
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
      expect(userService.update).toHaveBeenCalledWith(userId, {
        stripe_account_id: mockNewAccountId,
      });
      expect(stripe.accountLinks.create).toHaveBeenCalledWith({
        account: mockNewAccountId,
        refresh_url: `${clientUrl}/transactions`,
        return_url: `${clientUrl}/transactions`,
        type: 'account_onboarding',
      });
      expect(result).toEqual(mockAccountLinkUrl);
    });
  });

  describe('transferToAccount', () => {
    it('should transfer money to the user stripe account', async () => {
      const userId = MOCK_USER_ID;
      const amount = 100;
      const mockUserData = {
        stripe_account_id: 'accountId',
      };

      userService.findOneById.mockResolvedValue(mockUserData as any);
      stripe.accounts.retrieve.mockResolvedValue({
        charges_enabled: true,
      } as any);

      await stripeService.transferToAccount(amount, userId);

      expect(userService.findOneById).toHaveBeenCalledWith(userId);
      expect(stripe.accounts.retrieve).toHaveBeenCalledWith(
        mockUserData.stripe_account_id,
      );
      expect(stripe.transfers.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'usd',
        destination: mockUserData.stripe_account_id,
      });
    });

    it('should throw a NotFoundException if user stripe account is not found', async () => {
      const userId = MOCK_USER_ID;
      const amount = 100;
      const mockUserData = {
        stripe_account_id: null,
      };

      userService.findOneById.mockResolvedValue(mockUserData as any);

      await expect(
        stripeService.transferToAccount(amount, userId),
      ).rejects.toThrow(new NotFoundException('Stripe account not found'));
    });

    it('should throw a BadRequestException if user stripe account is not completed', async () => {
      const userId = MOCK_USER_ID;
      const amount = 100;
      const mockUserData = {
        stripe_account_id: 'accountId',
      };

      userService.findOneById.mockResolvedValue(mockUserData as any);
      stripe.accounts.retrieve.mockResolvedValue({
        charges_enabled: false,
      } as any);

      await expect(
        stripeService.transferToAccount(amount, userId),
      ).rejects.toThrow(
        new BadRequestException({
          code: TransactionExceptionCode.STRIPE_ACCOUNT_NOT_COMPLETED,
          message: 'You don`t complete stripe account registration',
        }),
      );
    });

    it('should throw an error if Stripe transfer fails', async () => {
      const userId = MOCK_USER_ID;
      const amount = 100;
      const mockUserData = {
        stripe_account_id: 'accountId',
      };

      userService.findOneById.mockResolvedValue(mockUserData as any);
      stripe.accounts.retrieve.mockResolvedValue({
        charges_enabled: true,
      } as any);
      stripe.transfers.create.mockRejectedValue(new Error('Transfer failed'));

      await expect(
        stripeService.transferToAccount(amount, userId),
      ).rejects.toThrow(new Error('Transfer failed'));
    });
  });
});
