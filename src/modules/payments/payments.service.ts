import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PaymentGateway, PaymentStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ResourceNotFoundException } from '../../common/exceptions/domain.exceptions.js';
import { PaymentGatewayFactory } from './payment-gateway.factory.js';

interface OrderForPayment {
  id: string;
  total: Prisma.Decimal | number | string;
}

export interface WebhookOutcome {
  duplicate: boolean;
  orderId?: string;
  status?: PaymentStatus;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: PaymentGatewayFactory,
  ) {}

  async initiatePayment(order: OrderForPayment, gateway: PaymentGateway, currency = 'usd') {
    const strategy = this.gatewayFactory.getGateway(gateway);
    const result = await strategy.createPaymentIntent({
      amount: Number(order.total),
      currency,
      orderId: order.id,
    });

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        gateway,
        gatewayIntentId: result.gatewayIntentId,
        status: result.status,
        amount: Number(order.total),
        currency,
      },
    });

    return result;
  }

  /**
   * Verifies signature, enforces idempotency via the unique (gateway, eventId)
   * row, and updates the Payment record. Deliberately does NOT touch
   * Order/Inventory state — the caller (PaymentsController) applies the
   * outcome via OrdersService, keeping Payments and Orders from depending
   * on each other's internals beyond this narrow result.
   */
  async recordWebhookEvent(
    gateway: PaymentGateway,
    rawBody: Buffer,
    signatureHeader: string,
  ): Promise<WebhookOutcome> {
    const strategy = this.gatewayFactory.getGateway(gateway);
    const event = strategy.verifyWebhookSignature(rawBody, signatureHeader);

    try {
      await this.prisma.processedWebhookEvent.create({ data: { gateway, eventId: event.eventId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.warn(`Duplicate webhook event ignored: ${gateway} ${event.eventId}`);
        return { duplicate: true };
      }
      throw error;
    }

    const payment = await this.prisma.payment.findUnique({ where: { gatewayIntentId: event.gatewayIntentId } });
    if (!payment) {
      this.logger.warn(`Webhook for unknown payment intent: ${event.gatewayIntentId}`);
      return { duplicate: false };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: event.status, rawPayload: event.raw as Prisma.InputJsonValue },
    });

    return { duplicate: false, orderId: payment.orderId, status: event.status };
  }

  async refundPayment(orderId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) {
      throw new ResourceNotFoundException('Payment', orderId);
    }

    const strategy = this.gatewayFactory.getGateway(payment.gateway);
    await strategy.refund({ gatewayIntentId: payment.gatewayIntentId, rawPayload: payment.rawPayload });

    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.REFUNDED } });
  }
}
