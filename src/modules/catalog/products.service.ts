import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { ProductStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate } from '../../common/dto/pagination.dto.js';
import { ResourceNotFoundException } from '../../common/exceptions/domain.exceptions.js';
import { ProductFilterDto, ProductSort } from './dto/product-filter.dto.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';
import type { CreateVariantDto } from './dto/create-variant.dto.js';
import type { UpdateVariantDto } from './dto/update-variant.dto.js';
import type { CreateImageDto } from './dto/create-image.dto.js';

const LIST_INCLUDE = {
  category: true,
  images: { orderBy: { position: 'asc' as const } },
  variants: {
    where: { isActive: true },
    include: { size: true, color: true },
  },
} satisfies Prisma.ProductInclude;

const DETAIL_INCLUDE = {
  category: true,
  images: { orderBy: { position: 'asc' as const } },
  variants: {
    include: { size: true, color: true, images: { orderBy: { position: 'asc' as const } } },
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ProductFilterDto) {
    const NEW_ARRIVAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      category: filter.category ? { slug: filter.category } : undefined,
      gender: filter.gender,
      material: filter.material,
      fitType: filter.fitType,
      pattern: filter.pattern,
      sleeveLength: filter.sleeveLength,
      tags: filter.tags ? { hasSome: filter.tags } : undefined,
      isOnSale: filter.onSale,
      createdAt: filter.newArrivals ? { gte: new Date(Date.now() - NEW_ARRIVAL_WINDOW_MS) } : undefined,
      avgRating: filter.minRating ? { gte: filter.minRating } : undefined,
      variants: {
        some: {
          isActive: true,
          stockQuantity: { gt: 0 },
          size: filter.size ? { label: { in: filter.size } } : undefined,
          color: filter.color ? { name: { in: filter.color } } : undefined,
          price: {
            gte: filter.minPrice,
            lte: filter.maxPrice,
          },
        },
      },
      OR: filter.q
        ? [
            { name: { contains: filter.q, mode: 'insensitive' } },
            { description: { contains: filter.q, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const SORT_MAP: Record<ProductSort, Prisma.ProductOrderByWithRelationInput> = {
      [ProductSort.PRICE_ASC]: { basePrice: 'asc' },
      [ProductSort.PRICE_DESC]: { basePrice: 'desc' },
      [ProductSort.NEWEST]: { createdAt: 'desc' },
      [ProductSort.BEST_SELLING]: { salesCount: 'desc' },
      // Postgres puts NULLs first on DESC by default, which would show
      // unrated/non-discounted products ahead of the ones actually being
      // sorted for — explicit `nulls: 'last'` keeps them at the bottom.
      [ProductSort.RATING]: { avgRating: { sort: 'desc', nulls: 'last' } },
      [ProductSort.DISCOUNT]: { discountAmount: { sort: 'desc', nulls: 'last' } },
    };
    const orderBy = filter.sort ? SORT_MAP[filter.sort] : SORT_MAP[ProductSort.NEWEST];

    const skip = (filter.page - 1) * filter.limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: filter.limit,
        include: LIST_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(data, total, filter.page, filter.limit);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: DETAIL_INCLUDE,
    });
    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new ResourceNotFoundException('Product', slug);
    }
    return product;
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto, ...this.computeSaleFields(dto.compareAtPrice, dto.basePrice) } });
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.ensureProductExists(id);
    const basePrice = dto.basePrice ?? Number(existing.basePrice);
    const compareAtPrice = dto.compareAtPrice !== undefined ? dto.compareAtPrice : Number(existing.compareAtPrice ?? 0) || undefined;
    return this.prisma.product.update({
      where: { id },
      data: { ...dto, ...this.computeSaleFields(compareAtPrice, basePrice) },
    });
  }

  /**
   * isOnSale/discountAmount can't be expressed as a Prisma `where` comparison
   * between two columns, but at write time we have both values in hand —
   * compute them here instead of leaving them to be derived at query time.
   */
  private computeSaleFields(compareAtPrice: number | undefined, basePrice: number) {
    const isOnSale = compareAtPrice !== undefined && compareAtPrice > basePrice;
    return {
      isOnSale,
      discountAmount: isOnSale ? Math.round((compareAtPrice! - basePrice) * 100) / 100 : null,
    };
  }

  async remove(id: string) {
    await this.ensureProductExists(id);
    await this.prisma.product.delete({ where: { id } });
  }

  async createVariant(productId: string, dto: CreateVariantDto) {
    await this.ensureProductExists(productId);
    return this.prisma.productVariant.create({ data: { ...dto, productId } });
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto) {
    await this.ensureVariantExists(variantId);
    return this.prisma.productVariant.update({ where: { id: variantId }, data: dto });
  }

  async createImage(dto: CreateImageDto, productId?: string) {
    return this.prisma.productImage.create({
      data: {
        url: dto.url,
        altText: dto.altText,
        position: dto.position ?? 0,
        productId: dto.variantId ? undefined : productId,
        variantId: dto.variantId,
      },
    });
  }

  async removeImage(id: string) {
    await this.prisma.productImage.delete({ where: { id } });
  }

  private async ensureProductExists(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new ResourceNotFoundException('Product', id);
    }
    return product;
  }

  private async ensureVariantExists(id: string) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id } });
    if (!variant) {
      throw new ResourceNotFoundException('ProductVariant', id);
    }
    return variant;
  }
}
