import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentStatus } from '../../../generated/prisma/enums.js';
import type {
  CreatePaymentIntentParams,
  IPaymentGateway,
  PaymentIntentResult,
  RefundParams,
  WebhookEvent,
} from '../interfaces/payment-gateway.interface.js';

@Injectable()
export class StripeGatewayStrategy implements IPaymentGateway {
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get<string>('stripe.secretKey') as string);
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      metadata: { orderId: params.orderId, ...params.metadata },
    });
    return {
      gatewayIntentId: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      status: PaymentStatus.CREATED,
    };
  }

  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): WebhookEvent {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret') as string;
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    const intent = event.data.object as Stripe.PaymentIntent;
    const status = this.mapEventToStatus(event.type);

    return { eventId: event.id, gatewayIntentId: intent.id, status, raw: event };
  }

  async refund(params: RefundParams): Promise<void> {
    // Our stored gatewayIntentId IS the Stripe PaymentIntent id, so refunding is direct.
    await this.stripe.refunds.create({ payment_intent: params.gatewayIntentId });
  }

  private mapEventToStatus(eventType: string): PaymentStatus {
    switch (eventType) {
      case 'payment_intent.succeeded':
        return PaymentStatus.SUCCEEDED;
      case 'payment_intent.payment_failed':
        return PaymentStatus.FAILED;
      case 'payment_intent.canceled':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.REQUIRES_ACTION;
    }
  }
}
