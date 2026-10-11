import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ReturnsController } from './returns.controller.js';
import { AdminReturnsController } from './admin-returns.controller.js';
import { ReturnsService } from './returns.service.js';

@Module({
  imports: [InventoryModule, PaymentsModule, NotificationsModule],
  controllers: [ReturnsController, AdminReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
