import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ResourceNotFoundException } from '../../common/exceptions/domain.exceptions.js';
import type { CreateColorDto } from './dto/create-color.dto.js';
import type { UpdateColorDto } from './dto/update-color.dto.js';

@Injectable()
export class ColorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.color.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateColorDto) {
    return this.prisma.color.create({ data: dto });
  }

  async update(id: string, dto: UpdateColorDto) {
    await this.ensureExists(id);
    return this.prisma.color.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.color.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const color = await this.prisma.color.findUnique({ where: { id } });
    if (!color) {
      throw new ResourceNotFoundException('Color', id);
    }
    return color;
  }
}
