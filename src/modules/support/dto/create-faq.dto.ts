import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { FaqCategory } from '../../../generated/prisma/enums.js';

export class CreateFaqDto {
  @IsEnum(FaqCategory)
  category!: FaqCategory;

  @IsString()
  @MinLength(1)
  question!: string;

  @IsString()
  @MinLength(1)
  answer!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  keywords!: string[];

  @IsOptional()
  isActive?: boolean;
}
