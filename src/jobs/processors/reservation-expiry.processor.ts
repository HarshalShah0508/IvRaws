import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { OrdersService } from '../../modules/orders/orders.service.js';
import { RESERVATION_QUEUE, type ExpireReservationJobData } from '../queues/reservation.queue.js';

@Processor(RESERVATION_QUEUE)
export class ReservationExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(ReservationExpiryProcessor.name);

  constructor(private readonly ordersService: OrdersService) {
    super();
  }

  async process(job: Job<ExpireReservationJobData>): Promise<void> {
    this.logger.log(`Checking reservation expiry for order ${job.data.orderId}`);
    await this.ordersService.releaseExpiredReservation(job.data.orderId);
  }
}
