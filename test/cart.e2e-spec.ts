import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('Cart (e2e, guest session)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  it('creates a guest cart, adds an item, and persists it across requests via cookie', async () => {
    const agent = request.agent(app.getHttpServer());

    const empty = await agent.get('/cart').expect(200);
    expect(empty.body.items).toEqual([]);

    const products = await agent.get('/products?category=t-shirts&limit=1').expect(200);
    const variantId = products.body.data[0].variants[0].id;

    const afterAdd = await agent.post('/cart/items').send({ variantId, quantity: 2 }).expect(201);
    expect(afterAdd.body.items).toHaveLength(1);
    expect(afterAdd.body.items[0].quantity).toBe(2);

    const refetched = await agent.get('/cart').expect(200);
    expect(refetched.body.items[0].quantity).toBe(2);

    const itemId = refetched.body.items[0].id;
    const updated = await agent.patch(`/cart/items/${itemId}`).send({ quantity: 5 }).expect(200);
    expect(updated.body.items[0].quantity).toBe(5);

    const removed = await agent.delete(`/cart/items/${itemId}`).expect(200);
    expect(removed.body.items).toEqual([]);
  });

  afterEach(async () => {
    await app.close();
  });
});
