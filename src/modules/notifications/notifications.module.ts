import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NOTIFICATION_QUEUE } from '../../jobs/queues/notification.queue.js';
import { EmailProcessor } from '../../jobs/processors/email.processor.js';
import { EmailService } from './email.service.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATION_QUEUE })],
  providers: [EmailService, NotificationsService, EmailProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
