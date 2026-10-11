import { IsInt, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateImageDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  variantId?: string;
}
