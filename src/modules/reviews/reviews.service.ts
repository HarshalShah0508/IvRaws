import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { OrderStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ResourceNotFoundException } from '../../common/exceptions/domain.exceptions.js';
import type { CreateReviewDto } from './dto/create-review.dto.js';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForProduct(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) {
      throw new ResourceNotFoundException('Product', slug);
    }
    return this.prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async create(userId: string, slug: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) {
      throw new ResourceNotFoundException('Product', slug);
    }

    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    const purchasedOrder = await this.prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        items: { some: { variant: { productId: product.id } } },
      },
    });
    if (!purchasedOrder) {
      throw new ForbiddenException('You can only review products from a delivered order');
    }

    await this.prisma.review.create({
      data: {
        productId: product.id,
        userId,
        orderId: purchasedOrder.id,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    await this.recomputeAggregate(product.id);

    return this.prisma.review.findUniqueOrThrow({
      where: { userId_productId: { userId, productId: product.id } },
    });
  }

  async removeAdmin(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new ResourceNotFoundException('Review', id);
    }
    await this.prisma.review.delete({ where: { id } });
    await this.recomputeAggregate(review.productId);
  }

  private async recomputeAggregate(productId: string): Promise<void> {
    const aggregate = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: aggregate._avg.rating ? roundTo2(aggregate._avg.rating) : null,
        reviewCount: aggregate._count,
      },
    });
  }
}
