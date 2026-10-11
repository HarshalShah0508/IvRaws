import { Test } from '@nestjs/testing';
import { InventoryService } from './inventory.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('InventoryService', () => {
  let inventoryService: InventoryService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [InventoryService, { provide: PrismaService, useValue: {} }],
    }).compile();
    inventoryService = moduleRef.get(InventoryService);
  });

  it('reserveStock returns true when the conditional UPDATE affects a row', async () => {
    const executor = { $executeRaw: vi.fn().mockResolvedValue(1) };
    const reserved = await inventoryService.reserveStock(executor as never, 'variant-1', 3);
    expect(reserved).toBe(true);
    expect(executor.$executeRaw).toHaveBeenCalledOnce();
  });

  it('reserveStock returns false when available stock is insufficient (0 rows affected)', async () => {
    const executor = { $executeRaw: vi.fn().mockResolvedValue(0) };
    const reserved = await inventoryService.reserveStock(executor as never, 'variant-1', 999);
    expect(reserved).toBe(false);
  });

  it('commitSale decrements both stockQuantity and reservedQuantity', async () => {
    const executor = { $executeRaw: vi.fn().mockResolvedValue(1) };
    await inventoryService.commitSale(executor as never, 'variant-1', 2);
    expect(executor.$executeRaw).toHaveBeenCalledOnce();
  });

  it('releaseReservation decrements reservedQuantity via the given executor', async () => {
    const executor = { $executeRaw: vi.fn().mockResolvedValue(1) };
    await inventoryService.releaseReservation(executor as never, 'variant-1', 2);
    expect(executor.$executeRaw).toHaveBeenCalledOnce();
  });
});
