import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';
import { MediaService } from './media.service.js';
import { PresignUploadDto } from './dto/presign-upload.dto.js';
import { ConfirmUploadDto } from './dto/confirm-upload.dto.js';

@Roles(Role.ADMIN, Role.STAFF)
@Controller('admin/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presign')
  presign(@Body() dto: PresignUploadDto) {
    return this.mediaService.presignUpload(dto);
  }

  @Post('confirm')
  confirm(@Body() dto: ConfirmUploadDto) {
    return this.mediaService.confirmUpload(dto);
  }
}
