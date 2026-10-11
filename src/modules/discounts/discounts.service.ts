import { Injectable } from '@nestjs/common';
import { DiscountType } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InvalidCouponException, ResourceNotFoundException } from '../../common/exceptions/domain.exceptions.js';
import type { CreateCouponDto } from './dto/create-coupon.dto.js';
import type { UpdateCouponDto } from './dto/update-coupon.dto.js';

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.coupon.findMany({ orderBy: { code: 'asc' } });
  }

  create(dto: CreateCouponDto) {
    return this.prisma.coupon.create({ data: dto });
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.ensureExists(id);
    return this.prisma.coupon.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.coupon.delete({ where: { id } });
  }

  /** Validates a coupon against a cart total and returns the coupon row plus the computed discount. */
  async validate(code: string, cartTotal: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      throw new InvalidCouponException('coupon not found or inactive');
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new InvalidCouponException('coupon has expired');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new InvalidCouponException('coupon usage limit reached');
    }
    if (coupon.minOrderValue !== null && cartTotal < Number(coupon.minOrderValue)) {
      throw new InvalidCouponException(`minimum order value is ${coupon.minOrderValue}`);
    }

    const discountAmount =
      coupon.discountType === DiscountType.PERCENT
        ? roundCurrency((cartTotal * Number(coupon.value)) / 100)
        : Math.min(Number(coupon.value), cartTotal);

    return { coupon, discountAmount: roundCurrency(discountAmount) };
  }

  private async ensureExists(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new ResourceNotFoundException('Coupon', id);
    }
    return coupon;
  }
}
