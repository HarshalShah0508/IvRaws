import { Test } from '@nestjs/testing';
import { ChatService } from './chat.service.js';
import { FaqService } from './faq.service.js';
import { OrdersService } from '../orders/orders.service.js';

describe('ChatService.query', () => {
  let chatService: ChatService;
  let faqService: { findBestMatch: ReturnType<typeof vi.fn>; suggestTopics: ReturnType<typeof vi.fn> };
  let ordersService: { findAllForUser: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    faqService = { findBestMatch: vi.fn(), suggestTopics: vi.fn().mockResolvedValue([]) };
    ordersService = { findAllForUser: vi.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: FaqService, useValue: faqService },
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();

    chatService = moduleRef.get(ChatService);
  });

  it('returns the FAQ answer when a keyword match is found', async () => {
    faqService.findBestMatch.mockResolvedValue({ answer: 'Returns are accepted within 30 days.' });

    const result = await chatService.query('what is your return policy');

    expect(result.type).toBe('faq');
    expect(result.reply).toContain('30 days');
    expect(ordersService.findAllForUser).not.toHaveBeenCalled();
  });

  it('does not look up order status for an unauthenticated "track my order" query', async () => {
    faqService.findBestMatch.mockResolvedValue(null);

    const result = await chatService.query('where is my order', undefined);

    expect(ordersService.findAllForUser).not.toHaveBeenCalled();
    expect(result.type).toBe('no-match');
  });

  it('looks up the real order status for an authenticated "track my order" query', async () => {
    ordersService.findAllForUser.mockResolvedValue([{ orderNumber: 'ORD-1', status: 'SHIPPED' }]);

    const result = await chatService.query('where is my order', 'user-1');

    expect(ordersService.findAllForUser).toHaveBeenCalledWith('user-1');
    expect(result.type).toBe('order-status');
    expect(result.reply).toContain('ORD-1');
    expect(result.reply).toContain('SHIPPED');
  });

  it('falls back to suggested topics when nothing matches', async () => {
    faqService.findBestMatch.mockResolvedValue(null);
    faqService.suggestTopics.mockResolvedValue([{ id: 'f1', question: 'Do you ship internationally?', category: 'SHIPPING' }]);

    const result = await chatService.query('do you sell hats');

    expect(result.type).toBe('no-match');
    expect(result.suggestions).toHaveLength(1);
  });
});
