import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { OrderStatus, PaymentGateway, PaymentStatus } from '../src/generated/prisma/enums.js';

describe('Stripe webhook idempotency (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let webhookSecret: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    webhookSecret = app.get(ConfigService).get<string>('stripe.webhookSecret') as string;
  });

  function signPayload(payload: string) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac('sha256', webhookSecret).update(`${timestamp}.${payload}`).digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }

  it('applies a payment_intent.succeeded event exactly once even when delivered twice', async () => {
    const user = await prisma.user.create({
      data: { email: `webhook-${Date.now()}@example.com`, passwordHash: 'x', role: 'CUSTOMER' },
    });
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: 'Test',
        line1: '1 St',
        city: 'City',
        state: 'CA',
        postalCode: '90000',
        country: 'US',
        phone: '555',
      },
    });
    const variant = await prisma.productVariant.findFirst({ where: { isActive: true } });
    if (!variant) throw new Error('No seeded variant available');

    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stockQuantity: { increment: 1 }, reservedQuantity: { increment: 1 } },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        userId: user.id,
        status: OrderStatus.PENDING_PAYMENT,
        subtotal: 10,
        total: 10,
        shippingAddressId: address.id,
        items: {
          create: [
            {
              variantId: variant.id,
              productName: 'Test',
              variantSku: variant.sku,
              unitPrice: 10,
              quantity: 1,
            },
          ],
        },
      },
    });

    const intentId = `pi_test_${randomUUID()}`;
    await prisma.payment.create({
      data: {
        orderId: order.id,
        gateway: PaymentGateway.STRIPE,
        gatewayIntentId: intentId,
        status: PaymentStatus.CREATED,
        amount: 10,
        currency: 'usd',
      },
    });

    const eventId = `evt_test_${randomUUID()}`;
    const payload = JSON.stringify({
      id: eventId,
      type: 'payment_intent.succeeded',
      data: { object: { id: intentId } },
    });
    const signature = signPayload(payload);

    const stockBefore = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });

    const first = await request(app.getHttpServer())
      .post('/payments/webhook/stripe')
      .set('stripe-signature', signature)
      .set('Content-Type', 'application/json')
      .send(payload);
    const second = await request(app.getHttpServer())
      .post('/payments/webhook/stripe')
      .set('stripe-signature', signature)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const finalOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(finalOrder.status).toBe(OrderStatus.PAID);

    const stockAfter = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(stockAfter.stockQuantity).toBe(stockBefore.stockQuantity - 1);
    expect(stockAfter.reservedQuantity).toBe(stockBefore.reservedQuantity - 1);

    const processedEvents = await prisma.processedWebhookEvent.findMany({ where: { eventId } });
    expect(processedEvents).toHaveLength(1);
  });

  afterEach(async () => {
    await app.close();
  });
});
