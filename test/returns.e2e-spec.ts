import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { OrderStatus } from '../src/generated/prisma/enums.js';

describe('Returns workflow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  async function makeDeliveredOrder(email: string) {
    const register = await request(app.getHttpServer()).post('/auth/register').send({ email, password: 'password123' });
    const token = register.body.accessToken;

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
        orderNumber: `TEST-RET-${Date.now()}`,
        userId: register.body.user.id,
        status: OrderStatus.DELIVERED,
        subtotal: 10,
        total: 10,
        shippingAddressId: address.id,
        items: {
          create: [{ variantId: variant.id, productName: 'Test', variantSku: variant.sku, unitPrice: 10, quantity: 1 }],
        },
      },
    });
    return { token, orderId: order.id };
  }

  it('rejects a return request for an order that is not yet delivered', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `notdelivered-${Date.now()}@example.com`, password: 'password123' });
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
        orderNumber: `TEST-PENDING-${Date.now()}`,
        userId: register.body.user.id,
        status: OrderStatus.PAID,
        subtotal: 10,
        total: 10,
        shippingAddressId: address.id,
        items: { create: [{ variantId: variant.id, productName: 'Test', variantSku: variant.sku, unitPrice: 10, quantity: 1 }] },
      },
    });

    await request(app.getHttpServer())
      .post(`/orders/${order.id}/return-request`)
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ reason: 'changed my mind' })
      .expect(400);
  });

  it('allows one request per delivered order, admin can approve, and a second concurrent request is rejected', async () => {
    const { token, orderId } = await makeDeliveredOrder(`returns-${Date.now()}@example.com`);

    const created = await request(app.getHttpServer())
      .post(`/orders/${orderId}/return-request`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'wrong size' })
      .expect(201);
    expect(created.body.status).toBe('REQUESTED');

    await request(app.getHttpServer())
      .post(`/orders/${orderId}/return-request`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'again' })
      .expect(409);

    const admin = await prisma.user.update({
      where: { id: (await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).userId },
      data: { role: 'ADMIN' },
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: admin.email, password: 'password123' });

    // Skipping APPROVED and going straight to REFUNDED must be rejected.
    await request(app.getHttpServer())
      .patch(`/admin/return-requests/${created.body.id}`)
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .send({ status: 'REFUNDED' })
      .expect(400);

    const approved = await request(app.getHttpServer())
      .patch(`/admin/return-requests/${created.body.id}`)
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .send({ status: 'APPROVED', adminNote: 'looks legit' })
      .expect(200);
    expect(approved.body.status).toBe('APPROVED');
  });

  afterEach(async () => {
    await app.close();
  });
});
