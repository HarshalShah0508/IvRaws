import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { FitType, Gender, Pattern, SleeveLength } from '../../../generated/prisma/enums.js';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

const toArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value : [value as string];
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return value === true || value === 'true';
};

export enum ProductSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  BEST_SELLING = 'best_selling',
  RATING = 'rating',
  DISCOUNT = 'discount',
}

export class ProductFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @IsString({ each: true })
  size?: string[];

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @IsString({ each: true })
  color?: string[];

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(ProductSort)
  sort?: ProductSort;

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
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  onSale?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  newArrivals?: boolean;

  // Social proof
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;
}
