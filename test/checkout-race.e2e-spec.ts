import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Checkout concurrency (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  async function registerAndAddress(email: string) {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' });
    const token = register.body.accessToken;

    const address = await request(app.getHttpServer())
      .post('/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Racer',
        line1: '1 Race St',
        city: 'Speedville',
        state: 'CA',
        postalCode: '90000',
        country: 'US',
        phone: '555-0000',
      });

    return { token, addressId: address.body.id };
  }

  it('lets only one of two concurrent checkouts reserve the last unit of stock', async () => {
    // Dedicated, isolated fixture data instead of reusing a shared seeded
    // variant: this session's earlier manual testing left stray
    // reservation-expiry jobs sitting in Redis (from orders whose Stripe call
    // always failed with the placeholder key), and a fresh BullMQ worker
    // drains those as soon as it connects — racing against a shared variant
    // and making this test flaky.
    const suffix = Date.now();
    const category = await prisma.category.findFirstOrThrow();
    const size = await prisma.size.findFirstOrThrow();
    const color = await prisma.color.findFirstOrThrow();
    const product = await prisma.product.create({
      data: {
        name: `Race Test Product ${suffix}`,
        slug: `race-test-product-${suffix}`,
        description: 'isolated fixture for the concurrency test',
        basePrice: 10,
        categoryId: category.id,
        status: 'ACTIVE',
      },
    });
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sizeId: size.id,
        colorId: color.id,
        sku: `RACE-TEST-${suffix}`,
        price: 10,
        stockQuantity: 1,
        reservedQuantity: 0,
      },
    });

    const racerA = await registerAndAddress(`racer-a-${suffix}@example.com`);
    const racerB = await registerAndAddress(`racer-b-${suffix}@example.com`);

    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${racerA.token}`)
      .send({ variantId: variant.id, quantity: 1 });
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${racerB.token}`)
      .send({ variantId: variant.id, quantity: 1 });

    const [resA, resB] = await Promise.all([
      request(app.getHttpServer())
        .post('/checkout')
        .set('Authorization', `Bearer ${racerA.token}`)
        .send({ shippingAddressId: racerA.addressId }),
      request(app.getHttpServer())
        .post('/checkout')
        .set('Authorization', `Bearer ${racerB.token}`)
        .send({ shippingAddressId: racerB.addressId }),
    ]);

    const statuses = [resA.status, resB.status];
    expect(statuses.filter((s) => s === 409)).toHaveLength(1);
    expect(statuses.filter((s) => s !== 409)).toHaveLength(1);

    const afterRace = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(afterRace.reservedQuantity).toBe(1);
  });

  afterEach(async () => {
    await app.close();
  });
});
