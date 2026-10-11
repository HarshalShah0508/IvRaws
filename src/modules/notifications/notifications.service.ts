import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { NOTIFICATION_QUEUE, SEND_EMAIL_JOB } from '../../jobs/queues/notification.queue.js';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue) {}

  async sendOrderConfirmation(params: { to: string; orderNumber: string; total: number | string }) {
    await this.queue.add(SEND_EMAIL_JOB, {
      to: params.to,
      subject: `Order confirmed — ${params.orderNumber}`,
      html: `<p>Thanks for your order!</p><p>Order <strong>${params.orderNumber}</strong> is confirmed. Total charged: <strong>${params.total}</strong>.</p>`,
    });
  }

  async sendOrderShipped(params: { to: string; orderNumber: string }) {
    await this.queue.add(SEND_EMAIL_JOB, {
      to: params.to,
      subject: `Your order has shipped — ${params.orderNumber}`,
      html: `<p>Good news — order <strong>${params.orderNumber}</strong> is on its way.</p>`,
    });
  }

  async sendPasswordReset(params: { to: string; resetLink: string }) {
    await this.queue.add(SEND_EMAIL_JOB, {
      to: params.to,
      subject: 'Reset your password',
      html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${params.resetLink}">${params.resetLink}</a></p><p>If you didn't request this, ignore this email.</p>`,
    });
  }

  async sendReturnRequestReceived(params: { to: string; orderNumber: string }) {
    await this.queue.add(SEND_EMAIL_JOB, {
      to: params.to,
      subject: `We received your return request — ${params.orderNumber}`,
      html: `<p>We've received your return request for order <strong>${params.orderNumber}</strong>. We'll review it and follow up shortly.</p>`,
    });
  }

  async sendReturnStatusUpdate(params: { to: string; orderNumber: string; status: string }) {
    await this.queue.add(SEND_EMAIL_JOB, {
      to: params.to,
      subject: `Update on your return — ${params.orderNumber}`,
      html: `<p>Your return request for order <strong>${params.orderNumber}</strong> is now: <strong>${params.status}</strong>.</p>`,
    });
  }
}
