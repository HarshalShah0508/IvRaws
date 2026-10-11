import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { ChatService } from './chat.service.js';
import { ChatQueryDto } from './dto/chat-query.dto.js';

@Public()
@UseGuards(OptionalJwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('query')
  query(@Req() req: Request & { user?: AuthenticatedUser | null }, @Body() dto: ChatQueryDto) {
    return this.chatService.query(dto.message, req.user?.id);
  }
}
