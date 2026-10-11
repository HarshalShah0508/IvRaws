import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class ConfirmUploadDto {
  @IsIn(['product', 'variant'])
  entityType!: 'product' | 'variant';

  @IsString()
  entityId!: string;

  @IsString()
  @MinLength(1)
  key!: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}
