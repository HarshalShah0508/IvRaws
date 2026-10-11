import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentGateway } from '../../generated/prisma/enums.js';
import type { IPaymentGateway } from './interfaces/payment-gateway.interface.js';
import { StripeGatewayStrategy } from './strategies/stripe.strategy.js';
import { RazorpayGatewayStrategy } from './strategies/razorpay.strategy.js';

@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private readonly stripeGateway: StripeGatewayStrategy,
    private readonly razorpayGateway: RazorpayGatewayStrategy,
  ) {}

  getGateway(gateway: PaymentGateway): IPaymentGateway {
    switch (gateway) {
      case PaymentGateway.STRIPE:
        return this.stripeGateway;
      case PaymentGateway.RAZORPAY:
        return this.razorpayGateway;
      default:
        throw new BadRequestException(`Payment gateway ${gateway} is not yet available`);
    }
  }
}
