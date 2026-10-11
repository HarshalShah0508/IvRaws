import { IsIn, IsString, MinLength } from 'class-validator';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;

export class PresignUploadDto {
  @IsString()
  @MinLength(1)
  fileName!: string;

  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType!: (typeof ALLOWED_CONTENT_TYPES)[number];

  @IsIn(['product', 'variant'])
  entityType!: 'product' | 'variant';

  @IsString()
  entityId!: string;
}
