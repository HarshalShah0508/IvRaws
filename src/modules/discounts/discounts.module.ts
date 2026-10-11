import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller.js';
import { AdminDiscountsController } from './admin-discounts.controller.js';
import { DiscountsService } from './discounts.service.js';

@Module({
  controllers: [DiscountsController, AdminDiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
