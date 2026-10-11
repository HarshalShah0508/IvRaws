import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ResourceNotFoundException } from '../../common/exceptions/domain.exceptions.js';
import type { CreateSizeDto } from './dto/create-size.dto.js';
import type { UpdateSizeDto } from './dto/update-size.dto.js';

@Injectable()
export class SizesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.size.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  create(dto: CreateSizeDto) {
    return this.prisma.size.create({ data: dto });
  }

  async update(id: string, dto: UpdateSizeDto) {
    await this.ensureExists(id);
    return this.prisma.size.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.size.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const size = await this.prisma.size.findUnique({ where: { id } });
    if (!size) {
      throw new ResourceNotFoundException('Size', id);
    }
    return size;
  }
}
