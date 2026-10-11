import { IsEnum, IsOptional } from 'class-validator';
import { ReturnRequestStatus } from '../../../generated/prisma/enums.js';

export class ReturnRequestFilterDto {
  @IsOptional()
  @IsEnum(ReturnRequestStatus)
  status?: ReturnRequestStatus;
}
