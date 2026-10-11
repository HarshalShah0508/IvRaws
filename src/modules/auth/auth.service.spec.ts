import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { Role } from '../../generated/prisma/enums.js';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByEmail: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let prisma: {
    refreshToken: { create: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
    passwordResetToken: { create: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    user: { update: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    prisma = {
      refreshToken: { create: vi.fn().mockResolvedValue({}), updateMany: vi.fn().mockResolvedValue({}) },
      passwordResetToken: {
        create: vi.fn().mockResolvedValue({}),
        findFirst: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      user: { update: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: vi.fn().mockResolvedValue('signed-token') } },
        { provide: ConfigService, useValue: { get: vi.fn().mockReturnValue('secret') } },
        { provide: NotificationsService, useValue: { sendPasswordReset: vi.fn() } },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('registers a new user and issues tokens', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      role: Role.CUSTOMER,
    });

    const result = await authService.register({
      email: 'new@example.com',
      password: 'password123',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.com' }),
    );
    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe('new@example.com');
  });

  it('rejects registration with an already-used email', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'existing' });

    await expect(
      authService.register({ email: 'dupe@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('validates correct credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'ok@example.com',
      role: Role.CUSTOMER,
      isActive: true,
      passwordHash,
    });

    const user = await authService.validateCredentials('ok@example.com', 'password123');
    expect(user).toEqual({ id: 'user-1', email: 'ok@example.com', role: Role.CUSTOMER });
  });

  it('rejects incorrect credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'ok@example.com',
      role: Role.CUSTOMER,
      isActive: true,
      passwordHash,
    });

    await expect(
      authService.validateCredentials('ok@example.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('resets the password with a valid token and revokes existing refresh tokens', async () => {
    prisma.passwordResetToken.findFirst.mockResolvedValue({ id: 'prt-1', userId: 'user-1' });

    await authService.resetPassword('raw-token', 'newpassword123');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 'prt-1' },
      data: { used: true },
    });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revoked: false },
      data: { revoked: true },
    });
  });

  it('rejects resetPassword with an unknown/expired/used token', async () => {
    prisma.passwordResetToken.findFirst.mockResolvedValue(null);

    await expect(authService.resetPassword('bad-token', 'newpassword123')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
