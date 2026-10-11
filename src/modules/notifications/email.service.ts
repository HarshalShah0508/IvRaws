import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { SendEmailJobData } from '../../jobs/queues/notification.queue.js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');

    this.transporter = createTransport({
      host: this.configService.get<string>('smtp.host'),
      port: this.configService.get<number>('smtp.port'),
      secure: false,
      auth: user && pass ? { user, pass } : undefined,
    });
    this.from = this.configService.get<string>('smtp.from') as string;
  }

  async send(data: SendEmailJobData): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to: data.to, subject: data.subject, html: data.html });
    this.logger.log(`Email sent to ${data.to}: ${data.subject}`);
  }
}
