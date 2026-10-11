import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { ProductsService } from '../catalog/products.service.js';
import type { PresignUploadDto } from './dto/presign-upload.dto.js';
import type { ConfirmUploadDto } from './dto/confirm-upload.dto.js';

const PRESIGN_EXPIRY_SECONDS = 300;

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
  ) {
    const endpoint = this.configService.get<string>('s3.endpoint') as string;
    this.bucket = this.configService.get<string>('s3.bucket') as string;
    this.publicBaseUrl = `${endpoint}/${this.bucket}`;

    this.s3 = new S3Client({
      endpoint,
      region: this.configService.get<string>('s3.region'),
      forcePathStyle: this.configService.get<boolean>('s3.forcePathStyle'),
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKeyId') as string,
        secretAccessKey: this.configService.get<string>('s3.secretAccessKey') as string,
      },
      // Newer SDK versions attach an x-amz-checksum-* param to presigned URLs
      // by default, which breaks a plain PUT from a browser/curl that doesn't
      // send a matching header. Only compute checksums when explicitly requested.
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
  }

  async presignUpload(dto: PresignUploadDto) {
    const sanitizedFileName = this.sanitizeFileName(dto.fileName);
    const key = `${dto.entityType}s/${dto.entityId}/${randomUUID()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: dto.contentType });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });

    return { uploadUrl, key };
  }

  async confirmUpload(dto: ConfirmUploadDto) {
    const url = `${this.publicBaseUrl}/${dto.key}`;
    return this.productsService.createImage(
      {
        url,
        altText: dto.altText,
        position: dto.position,
        variantId: dto.entityType === 'variant' ? dto.entityId : undefined,
      },
      dto.entityType === 'product' ? dto.entityId : undefined,
    );
  }

  private sanitizeFileName(fileName: string): string {
    const base = fileName.split(/[/\\]/).pop() ?? 'upload';
    return base.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-120);
  }
}
