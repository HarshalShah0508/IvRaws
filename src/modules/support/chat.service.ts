import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service.js';
import { FaqService } from './faq.service.js';

const ORDER_TRACKING_KEYWORDS = [
  'track',
  'where is my order',
  'order status',
  'my order',
  'shipment',
  'delivery status',
];

export interface ChatReply {
  type: 'order-status' | 'faq' | 'no-match';
  reply: string;
  suggestions?: Array<{ id: string; question: string; category: string }>;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly faqService: FaqService,
    private readonly ordersService: OrdersService,
  ) {}

  async query(message: string, userId?: string): Promise<ChatReply> {
    const normalized = message.toLowerCase();

    // The one spot this bot touches live data instead of canned FAQ text —
    // deterministic keyword match, not an LLM call.
    if (userId && ORDER_TRACKING_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      const orders = await this.ordersService.findAllForUser(userId);
      if (orders.length === 0) {
        return { type: 'order-status', reply: "You don't have any orders yet." };
      }
      const latest = orders[0];
      return {
        type: 'order-status',
        reply: `Your most recent order ${latest.orderNumber} is currently: ${latest.status}.`,
      };
    }

    const match = await this.faqService.findBestMatch(normalized);
    if (match) {
      return { type: 'faq', reply: match.answer };
    }

    const suggestions = await this.faqService.suggestTopics();
    return {
      type: 'no-match',
      reply: "I'm not sure about that. Here are some things I can help with:",
      suggestions,
    };
  }
}
