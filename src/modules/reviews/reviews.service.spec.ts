import { Test } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { OrderStatus } from '../../generated/prisma/enums.js';

describe('ReviewsService.create', () => {
  let reviewsService: ReviewsService;
  let prisma: {
    product: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    review: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
    };
    order: { findFirst: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      product: { findUnique: vi.fn().mockResolvedValue({ id: 'product-1' }), update: vi.fn().mockResolvedValue({}) },
      review: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'review-1' }),
        aggregate: vi.fn().mockResolvedValue({ _avg: { rating: 4.5 }, _count: 2 }),
      },
      order: { findFirst: vi.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [ReviewsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    reviewsService = moduleRef.get(ReviewsService);
  });

  it('creates a review when the user has a delivered order for the product, and recomputes the aggregate', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: 'order-1' });

    await reviewsService.create('user-1', 'tee', { rating: 5, comment: 'great' });

    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orderId: 'order-1', rating: 5 }) }),
    );
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { avgRating: 4.5, reviewCount: 2 },
    });
  });

  it('rejects when the user has no delivered order containing this product', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(reviewsService.create('user-1', 'tee', { rating: 5 })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it('rejects a second review from the same user for the same product', async () => {
    prisma.review.findUnique.mockResolvedValue({ id: 'existing-review' });

    await expect(reviewsService.create('user-1', 'tee', { rating: 3 })).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.order.findFirst).not.toHaveBeenCalled();
  });

  it('queries the order using the DELIVERED status so a merely-paid order cannot be reviewed yet', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: 'order-1' });

    await reviewsService.create('user-1', 'tee', { rating: 5 });

    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: OrderStatus.DELIVERED }) }),
    );
  });
});
