import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';

@Module({
  imports: [CatalogModule],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
