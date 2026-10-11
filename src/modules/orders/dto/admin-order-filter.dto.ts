import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../../../generated/prisma/enums.js';

export class AdminOrderFilterDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
