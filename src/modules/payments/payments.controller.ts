import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { PaymentGateway } from '../../generated/prisma/enums.js';
import { OrdersService } from '../orders/orders.service.js';
import { PaymentsService } from './payments.service.js';

@Public()
@Controller('payments/webhook')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('stripe')
  async stripeWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    return this.handleWebhook(PaymentGateway.STRIPE, req, signature);
  }

  @Post('razorpay')
  async razorpayWebhook(@Req() req: RawBodyRequest<Request>, @Headers('x-razorpay-signature') signature: string) {
    return this.handleWebhook(PaymentGateway.RAZORPAY, req, signature);
  }

  private async handleWebhook(gateway: PaymentGateway, req: RawBodyRequest<Request>, signature: string) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body for webhook signature verification');
    }
    const outcome = await this.paymentsService.recordWebhookEvent(gateway, req.rawBody, signature);
    if (!outcome.duplicate && outcome.orderId && outcome.status) {
      await this.ordersService.applyPaymentOutcome(outcome.orderId, outcome.status);
    }
    return { received: true };
  }
}
