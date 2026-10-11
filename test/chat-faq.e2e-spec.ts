import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { FaqCategory, OrderStatus } from '../src/generated/prisma/enums.js';

describe('Chat & FAQ (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let faqEntryId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Unscoped fixture data (no unique run suffix): every test run used to
    // leave a permanent duplicate "What is your return policy?" row behind,
    // and dozens had piled up in the dev database by the time this surfaced
    // in the chatbot's actual suggestion list. Deleted in afterEach now.
    const created = await prisma.faqEntry.create({
      data: {
        category: FaqCategory.RETURNS,
        question: 'What is your return policy?',
        answer: 'Returns are accepted within 30 days of delivery.',
        keywords: ['return policy', 'returns', 'refund'],
      },
    });
    faqEntryId = created.id;
  });

  it('/faq (GET) groups active entries by category', async () => {
    const response = await request(app.getHttpServer()).get('/faq').expect(200);
    expect(response.body.RETURNS[0].answer).toContain('30 days');
  });

  it('/chat/query matches an FAQ answer by keyword, with no auth required', async () => {
    const response = await request(app.getHttpServer())
      .post('/chat/query')
      .send({ message: 'what is your refund policy' })
      .expect(201);
    expect(response.body.type).toBe('faq');
    expect(response.body.reply).toContain('30 days');
  });

  it('/chat/query does not leak order data to an unauthenticated "track my order" message', async () => {
    const response = await request(app.getHttpServer())
      .post('/chat/query')
      .send({ message: 'where is my order' })
      .expect(201);
    expect(response.body.type).not.toBe('order-status');
  });

  it('/chat/query returns the real order status for an authenticated "track my order" message', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `chat-${Date.now()}@example.com`, password: 'password123' });
    const address = await prisma.address.create({
      data: {
        userId: register.body.user.id,
        fullName: 'Test',
        line1: '1 St',
        city: 'City',
        state: 'CA',
        postalCode: '90000',
        country: 'US',
        phone: '555',
      },
    });
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { isActive: true } });
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-CHAT-${Date.now()}`,
        userId: register.body.user.id,
        status: OrderStatus.SHIPPED,
        subtotal: 10,
        total: 10,
        shippingAddressId: address.id,
        items: { create: [{ variantId: variant.id, productName: 'Test', variantSku: variant.sku, unitPrice: 10, quantity: 1 }] },
      },
    });

    const response = await request(app.getHttpServer())
      .post('/chat/query')
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ message: 'where is my order' })
      .expect(201);

    expect(response.body.type).toBe('order-status');
    expect(response.body.reply).toContain(order.orderNumber);
    expect(response.body.reply).toContain('SHIPPED');
  });

  afterEach(async () => {
    await prisma.faqEntry.delete({ where: { id: faqEntryId } }).catch(() => undefined);
    await app.close();
  });
});
