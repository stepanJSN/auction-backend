import {
  Body,
  Controller,
  Post,
  RawBodyRequest,
  Req,
  Headers,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { Public } from 'src/decorators/public.decorator';
import { Request } from 'express';
import { CurrentUser } from 'src/decorators/user.decorator';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-payment-intent')
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stripeService.createPaymentIntent(
      createPaymentIntentDto.amount,
      userId,
    );
  }

  @Public()
  @Post('webhook')
  async webhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhookEvent(request.rawBody, signature);
  }

  @Post('create-account')
  async createAccount(@CurrentUser('id') userId: string) {
    return this.stripeService.createAccountLink(userId);
  }
}
