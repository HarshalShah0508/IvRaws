import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Password reset (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  it('request + wrong-token reset leaves the account and sessions untouched; unknown email is silently accepted', async () => {
    const email = `reset-${Date.now()}@example.com`;
    await request(app.getHttpServer()).post('/auth/register').send({ email, password: 'password123' }).expect(201);

    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'password123' });
    const oldRefreshToken = login.body.refreshToken;

    // Same response for a real vs unknown email — no account-enumeration leak.
    const realEmailResponse = await request(app.getHttpServer()).post('/auth/forgot-password').send({ email });
    const unknownEmailResponse = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: `nobody-${Date.now()}@example.com` });
    expect(realEmailResponse.status).toBe(unknownEmailResponse.status);
    expect(realEmailResponse.body).toEqual(unknownEmailResponse.body);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const pendingTokens = await prisma.passwordResetToken.count({ where: { userId: user.id, used: false } });
    expect(pendingTokens).toBe(1); // only the real email actually got a token row

    // A guessed/wrong token must not mutate anything — the original password
    // and the session created before the reset request both still work.
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'not-the-real-token', newPassword: 'brandnewpassword123' })
      .expect(400);

    await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'password123' }).expect(201);
    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: oldRefreshToken }).expect(201);
  });

  afterEach(async () => {
    await app.close();
  });
});
