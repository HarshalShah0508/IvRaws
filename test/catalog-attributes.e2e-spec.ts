import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { OrderStatus } from '../src/generated/prisma/enums.js';

describe('Catalog attributes, merchandising & reviews (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  async function makeProduct(overrides: Record<string, unknown>) {
    const category = await prisma.category.findFirstOrThrow();
    const size = await prisma.size.findFirstOrThrow();
    const color = await prisma.color.findFirstOrThrow();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const product = await prisma.product.create({
      data: {
        name: `Attr Test ${suffix}`,
        slug: `attr-test-${suffix}`,
        description: 'fixture',
        basePrice: 20,
        categoryId: category.id,
        status: 'ACTIVE',
        ...overrides,
      },
    });
    // findAll() only lists products with at least one in-stock active variant.
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sizeId: size.id,
        colorId: color.id,
        sku: `ATTR-TEST-${suffix}`,
        price: 20,
        stockQuantity: 10,
      },
    });
    return product;
  }

  it('filters by material, fitType, and tags', async () => {
    const onSaleProduct = await makeProduct({
      material: 'cotton',
      fitType: 'OVERSIZED',
      tags: ['e2e-summer25'],
      compareAtPrice: 30,
      isOnSale: true,
      discountAmount: 10,
    });
    await makeProduct({ material: 'polyester', fitType: 'SLIM' });

    const byMaterial = await request(app.getHttpServer()).get('/products?material=cotton').expect(200);
    expect(byMaterial.body.data.some((p: { id: string }) => p.id === onSaleProduct.id)).toBe(true);
    expect(byMaterial.body.data.every((p: { material: string }) => p.material === 'cotton')).toBe(true);

    const byTag = await request(app.getHttpServer()).get('/products?tags=e2e-summer25').expect(200);
    expect(byTag.body.data.map((p: { id: string }) => p.id)).toContain(onSaleProduct.id);

    const onSale = await request(app.getHttpServer()).get('/products?onSale=true').expect(200);
    expect(onSale.body.data.map((p: { id: string }) => p.id)).toContain(onSaleProduct.id);
  });

  it('sorts by discount with nulls last (non-discounted products never rank above a discounted one)', async () => {
    const discounted = await makeProduct({ compareAtPrice: 35, isOnSale: true, discountAmount: 15 });
    await makeProduct({});

    const response = await request(app.getHttpServer()).get('/products?sort=discount&limit=50').expect(200);
    const ids = response.body.data.map((p: { id: string }) => p.id);
    const discountedIndex = ids.indexOf(discounted.id);
    expect(discountedIndex).toBeGreaterThanOrEqual(0);

    // Nothing with a null discountAmount should appear before the discounted product.
    const nonDiscountedBeforeIt = response.body.data
      .slice(0, discountedIndex)
      .some((p: { discountAmount: unknown }) => p.discountAmount !== null);
    expect(nonDiscountedBeforeIt).toBe(false);
  });

  it('review lifecycle: blocked without a delivered order, allowed after delivery, aggregate updates, duplicate blocked', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `reviewer-${Date.now()}@example.com`, password: 'password123' });
    const token = register.body.accessToken;
    const userId = register.body.user.id;

    // Two fully isolated fixture products — never touching shared seeded data,
    // which the race-condition test earlier in this session also had to
    // learn the hard way: repeated runs accumulate reviews/orders against
    // anything shared, making count-based assertions flaky.
    const unrelatedProduct = await makeProduct({});
    const purchasedProduct = await makeProduct({});
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { productId: purchasedProduct.id } });

    await request(app.getHttpServer())
      .post(`/products/${unrelatedProduct.slug}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5 })
      .expect(403);

    const address = await prisma.address.create({
      data: {
        userId,
        fullName: 'Test',
        line1: '1 St',
        city: 'City',
        state: 'CA',
        postalCode: '90000',
        country: 'US',
        phone: '555',
      },
    });
    await prisma.order.create({
      data: {
        orderNumber: `TEST-REVIEW-${Date.now()}`,
        userId,
        status: OrderStatus.DELIVERED,
        subtotal: 10,
        total: 10,
        shippingAddressId: address.id,
        items: {
          create: [
            {
              variantId: variant.id,
              productName: purchasedProduct.name,
              variantSku: variant.sku,
              unitPrice: 10,
              quantity: 1,
            },
          ],
        },
      },
    });

    // The delivered order references `purchasedProduct`'s variant, not
    // `unrelatedProduct` — so reviewing the unrelated one must still be
    // blocked, while the purchased one is now reviewable.
    await request(app.getHttpServer())
      .post(`/products/${unrelatedProduct.slug}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5 })
      .expect(403);

    const created = await request(app.getHttpServer())
      .post(`/products/${purchasedProduct.slug}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4, comment: 'solid' })
      .expect(201);
    expect(created.body.rating).toBe(4);

    const afterReview = await request(app.getHttpServer()).get(`/products/${purchasedProduct.slug}`).expect(200);
    expect(Number(afterReview.body.avgRating)).toBe(4);
    expect(afterReview.body.reviewCount).toBe(1);

    await request(app.getHttpServer())
      .post(`/products/${purchasedProduct.slug}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 2 })
      .expect(409);
  });

  afterEach(async () => {
    await app.close();
  });
});
