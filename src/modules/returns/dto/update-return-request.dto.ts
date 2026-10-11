import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReturnRequestStatus } from '../../../generated/prisma/enums.js';

export class UpdateReturnRequestDto {
  @IsEnum(ReturnRequestStatus)
  status!: ReturnRequestStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}
