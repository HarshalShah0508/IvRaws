import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import { PaymentStatus } from '../../../generated/prisma/enums.js';
import type {
  CreatePaymentIntentParams,
  IPaymentGateway,
  PaymentIntentResult,
  RefundParams,
  WebhookEvent,
} from '../interfaces/payment-gateway.interface.js';

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: { payment?: { entity?: RazorpayPaymentEntity } };
}

@Injectable()
export class RazorpayGatewayStrategy implements IPaymentGateway {
  private readonly razorpay: Razorpay;
  private readonly keyId: string;

  constructor(private readonly configService: ConfigService) {
    this.keyId = this.configService.get<string>('razorpay.keyId') as string;
    this.razorpay = new Razorpay({
      key_id: this.keyId,
      key_secret: this.configService.get<string>('razorpay.keySecret') as string,
    });
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const order = await this.razorpay.orders.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency.toUpperCase(),
      receipt: params.orderId,
      notes: { orderId: params.orderId, ...params.metadata },
    });

    return {
      gatewayIntentId: order.id,
      status: PaymentStatus.CREATED,
      extra: { keyId: this.keyId },
    };
  }

  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): WebhookEvent {
    const webhookSecret = this.configService.get<string>('razorpay.webhookSecret') as string;
    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(signatureHeader ?? '', 'utf8');
    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    const body = JSON.parse(rawBody.toString('utf8')) as RazorpayWebhookPayload;
    const paymentEntity = body.payload?.payment?.entity;
    if (!paymentEntity) {
      throw new BadRequestException('Unrecognized Razorpay webhook payload');
    }

    return {
      eventId: `${body.event}:${paymentEntity.id}`,
      gatewayIntentId: paymentEntity.order_id,
      status: this.mapEventToStatus(body.event),
      raw: body,
    };
  }

  async refund(params: RefundParams): Promise<void> {
    // Unlike Stripe, our stored gatewayIntentId is the Razorpay *order* id, not
    // the payment id refunds require — the real payment id only shows up inside
    // the captured webhook's payload, which PaymentsService hands us here.
    const paymentEntity = (params.rawPayload as RazorpayWebhookPayload | undefined)?.payload?.payment?.entity;
    if (!paymentEntity?.id) {
      throw new BadRequestException('No captured Razorpay payment found to refund for this order');
    }
    await this.razorpay.payments.refund(paymentEntity.id, {});
  }

  private mapEventToStatus(eventType: string): PaymentStatus {
    switch (eventType) {
      case 'payment.captured':
        return PaymentStatus.SUCCEEDED;
      case 'payment.failed':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.REQUIRES_ACTION;
    }
  }
}
