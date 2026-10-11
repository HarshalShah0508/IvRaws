import { Body, Controller, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { ReturnsService } from './returns.service.js';
import { CreateReturnRequestDto } from './dto/create-return-request.dto.js';

@Controller('orders')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post(':id/return-request')
  create(@CurrentUser() user: AuthenticatedUser, @Param('id') orderId: string, @Body() dto: CreateReturnRequestDto) {
    return this.returnsService.createForUser(user.id, orderId, dto.reason);
  }
}
