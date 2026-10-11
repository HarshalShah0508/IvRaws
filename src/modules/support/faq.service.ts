import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ResourceNotFoundException } from '../../common/exceptions/domain.exceptions.js';
import type { FaqEntry } from '../../generated/prisma/client.js';
import type { CreateFaqDto } from './dto/create-faq.dto.js';
import type { UpdateFaqDto } from './dto/update-faq.dto.js';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublicGrouped(): Promise<Record<string, FaqEntry[]>> {
    const entries = await this.prisma.faqEntry.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    const grouped: Record<string, FaqEntry[]> = {};
    for (const entry of entries) {
      (grouped[entry.category] ??= []).push(entry);
    }
    return grouped;
  }

  findAllAdmin() {
    return this.prisma.faqEntry.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateFaqDto) {
    return this.prisma.faqEntry.create({ data: dto });
  }

  async update(id: string, dto: UpdateFaqDto) {
    await this.ensureExists(id);
    return this.prisma.faqEntry.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.faqEntry.delete({ where: { id } });
  }

  /** Deterministic keyword/substring scoring — no AI, fully explainable matching. */
  async findBestMatch(normalizedMessage: string): Promise<FaqEntry | null> {
    const entries = await this.prisma.faqEntry.findMany({ where: { isActive: true } });

    let best: { entry: FaqEntry; score: number } | null = null;
    for (const entry of entries) {
      let score = 0;
      for (const keyword of entry.keywords) {
        if (normalizedMessage.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }
      if (normalizedMessage.includes(entry.question.toLowerCase())) {
        score += 3;
      }
      if (score > 0 && (!best || score > best.score)) {
        best = { entry, score };
      }
    }
    return best?.entry ?? null;
  }

  async suggestTopics(limit = 5) {
    const entries = await this.prisma.faqEntry.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
    return entries.map((entry) => ({ id: entry.id, question: entry.question, category: entry.category }));
  }

  private async ensureExists(id: string) {
    const entry = await this.prisma.faqEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new ResourceNotFoundException('FaqEntry', id);
    }
    return entry;
  }
}
