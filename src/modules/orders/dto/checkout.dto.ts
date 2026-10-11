import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentGateway } from '../../../generated/prisma/enums.js';

export class CheckoutDto {
  @IsString()
  shippingAddressId!: string;

  @IsOptional()
  @IsString()
  billingAddressId?: string;

  @IsOptional()
  @IsEnum(PaymentGateway)
  gateway?: PaymentGateway;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
