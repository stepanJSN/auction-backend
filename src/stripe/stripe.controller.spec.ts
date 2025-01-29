import { Test } from '@nestjs/testing';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { MOCK_USER_ID } from 'config/mock-test-data';

describe('StripeController', () => {
  let stripeController: StripeController;
  let stripeService: DeepMockProxy<StripeService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        { provide: StripeService, useValue: mockDeep<StripeService>() },
      ],
    }).compile();

    stripeController = module.get(StripeController);
    stripeService = module.get(StripeService);
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      const createPaymentIntentDto = {
        amount: 10,
      };
      const userId = MOCK_USER_ID;
      const clientSecret = 'clientSecret';

      stripeService.createPaymentIntent.mockResolvedValue({
        clientSecret,
      });

      const result = await stripeController.createPaymentIntent(
        createPaymentIntentDto,
        userId,
      );

      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        createPaymentIntentDto.amount,
        userId,
      );
      expect(result).toEqual({ clientSecret });
    });
  });

  describe('handleWebhookEvent', () => {
    it('should handle a successful payment', async () => {
      const request = { rawBody: 'rawBody' };
      const signatureHeader = 'signature';

      await expect(
        stripeController.handleWebhookEvent(request as any, signatureHeader),
      ).resolves.toBeUndefined();
      expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(
        request.rawBody,
        signatureHeader,
      );
    });
  });

  describe('createAccount', () => {
    it('should create a Stripe account', async () => {
      const userId = MOCK_USER_ID;
      const accountLink = 'http://account-link';

      stripeService.createAccountLink.mockResolvedValue(accountLink);

      const result = await stripeController.createAccount(userId);

      expect(stripeService.createAccountLink).toHaveBeenCalledWith(userId);
      expect(result).toBe(accountLink);
    });
  });
});
