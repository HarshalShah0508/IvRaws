import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsNumber()
  @Min(0)
  cartTotal!: number;
}
