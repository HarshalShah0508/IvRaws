import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CartModule } from '../cart/cart.module.js';
import { AddressesModule } from '../addresses/addresses.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { DiscountsModule } from '../discounts/discounts.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PaymentsController } from '../payments/payments.controller.js';
import { RESERVATION_QUEUE } from '../../jobs/queues/reservation.queue.js';
import { ReservationExpiryProcessor } from '../../jobs/processors/reservation-expiry.processor.js';
import { OrdersController } from './orders.controller.js';
import { AdminOrdersController } from './admin-orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: RESERVATION_QUEUE }),
    CartModule,
    AddressesModule,
    InventoryModule,
    PaymentsModule,
    DiscountsModule,
    NotificationsModule,
  ],
  controllers: [OrdersController, AdminOrdersController, PaymentsController],
  providers: [OrdersService, ReservationExpiryProcessor],
  exports: [OrdersService],
})
export class OrdersModule {}
