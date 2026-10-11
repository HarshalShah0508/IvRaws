import { Test } from '@nestjs/testing';
import { DiscountsService } from './discounts.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DiscountType } from '../../generated/prisma/enums.js';
import { InvalidCouponException } from '../../common/exceptions/domain.exceptions.js';

describe('DiscountsService.validate', () => {
  let discountsService: DiscountsService;
  let prisma: { coupon: { findUnique: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    prisma = { coupon: { findUnique: vi.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [DiscountsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    discountsService = moduleRef.get(DiscountsService);
  });

  it('computes a percent discount correctly', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      id: 'c1',
      code: 'YOUTH20',
      discountType: DiscountType.PERCENT,
      value: 20,
      minOrderValue: null,
      maxUses: null,
      usedCount: 0,
      expiresAt: null,
      isActive: true,
    });

    const { discountAmount } = await discountsService.validate('YOUTH20', 50);
    expect(discountAmount).toBe(10);
  });

  it('caps a fixed discount at the cart total so total never goes negative', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      id: 'c2',
      code: 'BIGFIXED',
      discountType: DiscountType.FIXED,
      value: 100,
      minOrderValue: null,
      maxUses: null,
      usedCount: 0,
      expiresAt: null,
      isActive: true,
    });

    const { discountAmount } = await discountsService.validate('BIGFIXED', 15);
    expect(discountAmount).toBe(15);
  });

  it('rejects a coupon that has hit its usage limit', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      id: 'c3',
      code: 'LIMITED',
      discountType: DiscountType.PERCENT,
      value: 10,
      minOrderValue: null,
      maxUses: 1,
      usedCount: 1,
      expiresAt: null,
      isActive: true,
    });

    await expect(discountsService.validate('LIMITED', 50)).rejects.toBeInstanceOf(InvalidCouponException);
  });

  it('rejects an unknown coupon code', async () => {
    prisma.coupon.findUnique.mockResolvedValue(null);
    await expect(discountsService.validate('NOPE', 50)).rejects.toBeInstanceOf(InvalidCouponException);
  });
});
