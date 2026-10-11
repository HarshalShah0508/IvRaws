import { Test } from '@nestjs/testing';
import { FaqService } from './faq.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FaqCategory } from '../../generated/prisma/enums.js';

describe('FaqService.findBestMatch', () => {
  let faqService: FaqService;
  let prisma: { faqEntry: { findMany: ReturnType<typeof vi.fn> } };

  const entries = [
    {
      id: 'f1',
      category: FaqCategory.SHIPPING,
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 3-5 business days.',
      keywords: ['shipping', 'delivery time'],
      isActive: true,
    },
    {
      id: 'f2',
      category: FaqCategory.RETURNS,
      question: 'What is your return policy?',
      answer: 'Returns accepted within 30 days.',
      keywords: ['return policy', 'returns', 'refund'],
      isActive: true,
    },
  ];

  beforeEach(async () => {
    prisma = { faqEntry: { findMany: vi.fn().mockResolvedValue(entries) } };
    const moduleRef = await Test.createTestingModule({
      providers: [FaqService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    faqService = moduleRef.get(FaqService);
  });

  it('matches the entry whose keywords appear in the message', async () => {
    const match = await faqService.findBestMatch('what is your refund policy');
    expect(match?.id).toBe('f2');
  });

  it('picks the higher-scoring entry when one matches its full question text too', async () => {
    // f2 scores: "return policy" keyword (+2) + the full question text appearing
    // verbatim in the message (+3) = 5. f1 scores: "shipping" keyword (+2) only.
    const match = await faqService.findBestMatch('what is your return policy? also, how long for shipping');
    expect(match?.id).toBe('f2');
  });

  it('returns null when nothing scores above zero', async () => {
    const match = await faqService.findBestMatch('do you sell hats');
    expect(match).toBeNull();
  });
});
