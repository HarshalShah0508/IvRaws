import { Test } from '@nestjs/testing';
import { ProductsService } from './products.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('ProductsService sale field computation', () => {
  let productsService: ProductsService;
  let prisma: { product: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    prisma = {
      product: {
        create: vi.fn((args) => args.data),
        update: vi.fn((args) => args.data),
        findUnique: vi.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    productsService = moduleRef.get(ProductsService);
  });

  it('marks a product on sale when compareAtPrice is above basePrice, and computes the discount amount', async () => {
    const result = await productsService.create({
      name: 'Tee',
      slug: 'tee',
      description: 'd',
      basePrice: 20,
      categoryId: 'cat-1',
      compareAtPrice: 30,
    });

    expect(result.isOnSale).toBe(true);
    expect(result.discountAmount).toBe(10);
  });

  it('does not mark a product on sale when compareAtPrice is below or equal to basePrice', async () => {
    const result = await productsService.create({
      name: 'Tee',
      slug: 'tee',
      description: 'd',
      basePrice: 20,
      categoryId: 'cat-1',
      compareAtPrice: 20,
    });

    expect(result.isOnSale).toBe(false);
    expect(result.discountAmount).toBeNull();
  });

  it('on update, falls back to the existing basePrice/compareAtPrice when not provided in the DTO', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1', basePrice: 20, compareAtPrice: 30 });

    const result = await productsService.update('p1', { name: 'New Name' });

    expect(result.isOnSale).toBe(true);
    expect(result.discountAmount).toBe(10);
  });
});
