import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator.js';
import { DiscountsService } from './discounts.service.js';
import { ValidateCouponDto } from './dto/validate-coupon.dto.js';

@Controller('coupons')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('validate')
  async validate(@Body() dto: ValidateCouponDto) {
    const { coupon, discountAmount } = await this.discountsService.validate(dto.code, dto.cartTotal);
    return {
      code: coupon.code,
      discountAmount,
      total: Math.round((dto.cartTotal - discountAmount) * 100) / 100,
    };
  }
}
