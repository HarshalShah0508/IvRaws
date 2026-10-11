import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { EmailService } from '../../modules/notifications/email.service.js';
import { NOTIFICATION_QUEUE, type SendEmailJobData } from '../queues/notification.queue.js';

@Processor(NOTIFICATION_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<SendEmailJobData>): Promise<void> {
    try {
      await this.emailService.send(job.data);
    } catch (error) {
      this.logger.error(`Failed to send email to ${job.data.to}`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }
}
