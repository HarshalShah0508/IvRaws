import { ArrayNotEmpty, IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { FitType, Gender, Pattern, ProductStatus, SleeveLength } from '../../../generated/prisma/enums.js';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  slug!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  // Core attributes
  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsEnum(FitType)
  fitType?: FitType;

  @IsOptional()
  @IsEnum(Pattern)
  pattern?: Pattern;

  @IsOptional()
  @IsEnum(SleeveLength)
  sleeveLength?: SleeveLength;

  // Merchandising
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;
}
