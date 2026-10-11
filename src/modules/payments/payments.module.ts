import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentGatewayFactory } from './payment-gateway.factory.js';
import { StripeGatewayStrategy } from './strategies/stripe.strategy.js';
import { RazorpayGatewayStrategy } from './strategies/razorpay.strategy.js';

// The Stripe webhook controller lives in OrdersModule instead of here: it
// needs both PaymentsService and OrdersService, and registering it there
// (which already imports this module) avoids a circular module dependency
// that would otherwise exist between Orders <-> Payments.
@Module({
  providers: [PaymentsService, PaymentGatewayFactory, StripeGatewayStrategy, RazorpayGatewayStrategy],
  exports: [PaymentsService],
})
export class PaymentsModule {}
