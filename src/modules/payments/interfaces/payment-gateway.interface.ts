import type { PaymentStatus } from '../../../generated/prisma/enums.js';

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  orderId: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  gatewayIntentId: string;
  clientSecret?: string;
  status: PaymentStatus;
  /** Gateway-specific values the frontend needs that don't fit the common shape (e.g. Razorpay's public key id). */
  extra?: Record<string, string>;
}

export interface WebhookEvent {
  eventId: string;
  gatewayIntentId: string;
  status: PaymentStatus;
  raw: unknown;
}

export interface RefundParams {
  gatewayIntentId: string;
  /** Last webhook payload stored for this payment — Razorpay needs it to find the actual payment id. */
  rawPayload?: unknown;
}

export interface IPaymentGateway {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): WebhookEvent;
  refund(params: RefundParams): Promise<void>;
}
