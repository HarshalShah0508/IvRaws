import { IsEnum, IsInt, IsString, MinLength } from 'class-validator';
import { SizeType } from '../../../generated/prisma/enums.js';

export class CreateSizeDto {
  @IsString()
  @MinLength(1)
  label!: string;

  @IsInt()
  sortOrder!: number;

  @IsEnum(SizeType)
  type!: SizeType;
}
