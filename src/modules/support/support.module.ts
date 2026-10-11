import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { FaqController, AdminFaqController } from './faq.controller.js';
import { FaqService } from './faq.service.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [OrdersModule],
  controllers: [FaqController, AdminFaqController, ChatController],
  providers: [FaqService, ChatService],
})
export class SupportModule {}
