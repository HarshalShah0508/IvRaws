import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('Catalog (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  it('/categories (GET) lists seeded categories', async () => {
    const response = await request(app.getHttpServer()).get('/categories').expect(200);
    const slugs = response.body.map((c: { slug: string }) => c.slug);
    expect(slugs).toContain('t-shirts');
    expect(slugs).toContain('pants');
  });

  it('/products (GET) filters by category and returns paginated shape', async () => {
    const response = await request(app.getHttpServer()).get('/products?category=t-shirts&limit=2').expect(200);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 2 });
    expect(Array.isArray(response.body.data)).toBe(true);
    for (const product of response.body.data) {
      expect(product.category.slug).toBe('t-shirts');
    }
  });

  it('/products/:slug (GET) 404s for an unknown slug', async () => {
    await request(app.getHttpServer()).get('/products/does-not-exist').expect(404);
  });

  it('/admin/categories (POST) rejects unauthenticated requests', async () => {
    await request(app.getHttpServer())
      .post('/admin/categories')
      .send({ name: 'Unauthorized Category', slug: `unauthorized-${Date.now()}` })
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
