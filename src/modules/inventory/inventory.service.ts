import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

export interface LowStockVariant {
  id: string;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
}

// Narrow interface so reservation methods can run either against the main
// PrismaService or an interactive transaction client ($transaction callback arg).
type SqlExecutor = Pick<PrismaClient, '$executeRaw'>;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically reserves stock for a variant. Returns false (reserving nothing)
   * if available stock (stockQuantity - reservedQuantity) is insufficient —
   * this column-vs-column comparison can't be expressed in Prisma's query
   * builder, hence the raw conditional UPDATE.
   */
  async reserveStock(executor: SqlExecutor, variantId: string, quantity: number): Promise<boolean> {
    const affected = await executor.$executeRaw`
      UPDATE product_variants
      SET "reservedQuantity" = "reservedQuantity" + ${quantity}
      WHERE id = ${variantId} AND "isActive" = true AND "stockQuantity" - "reservedQuantity" >= ${quantity}
    `;
    return affected > 0;
  }

  async releaseReservation(executor: SqlExecutor, variantId: string, quantity: number): Promise<void> {
    await executor.$executeRaw`
      UPDATE product_variants
      SET "reservedQuantity" = "reservedQuantity" - ${quantity}
      WHERE id = ${variantId}
    `;
  }

  async commitSale(executor: SqlExecutor, variantId: string, quantity: number): Promise<void> {
    await executor.$executeRaw`
      UPDATE product_variants
      SET "stockQuantity" = "stockQuantity" - ${quantity}, "reservedQuantity" = "reservedQuantity" - ${quantity}
      WHERE id = ${variantId}
    `;
  }

  async restock(executor: SqlExecutor, variantId: string, quantity: number): Promise<void> {
    await executor.$executeRaw`
      UPDATE product_variants SET "stockQuantity" = "stockQuantity" + ${quantity} WHERE id = ${variantId}
    `;
  }

  findLowStock(threshold: number): Promise<LowStockVariant[]> {
    return this.prisma.$queryRaw<LowStockVariant[]>`
      SELECT id, sku, "stockQuantity", "reservedQuantity"
      FROM product_variants
      WHERE "isActive" = true AND "stockQuantity" - "reservedQuantity" < ${threshold}
      ORDER BY ("stockQuantity" - "reservedQuantity") ASC
    `;
  }

  async adjustStock(variantId: string, delta: number): Promise<void> {
    const affected = await this.prisma.$executeRaw`
      UPDATE product_variants
      SET "stockQuantity" = "stockQuantity" + ${delta}
      WHERE id = ${variantId} AND "stockQuantity" + ${delta} >= 0
    `;
    if (affected === 0) {
      throw new BadRequestException('Adjustment would result in negative stock, or variant not found');
    }
  }
}
