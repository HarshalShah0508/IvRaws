import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ResourceNotFoundException } from '../../common/exceptions/domain.exceptions.js';

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: { product: true, size: true, color: true },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(userId?: string, sessionId?: string) {
    if (userId) {
      const existing = await this.prisma.cart.findUnique({ where: { userId } });
      return existing ?? this.prisma.cart.create({ data: { userId } });
    }
    const existing = await this.prisma.cart.findUnique({ where: { sessionId } });
    return existing ?? this.prisma.cart.create({ data: { sessionId } });
  }

  async getCart(cartId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId }, include: CART_INCLUDE });
    if (!cart) {
      throw new ResourceNotFoundException('Cart', cartId);
    }
    return this.toCartResponse(cart);
  }

  async addItem(cartId: string, variantId: string, quantity: number) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || !variant.isActive) {
      throw new ResourceNotFoundException('ProductVariant', variantId);
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
    });
    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await this.prisma.cartItem.create({ data: { cartId, variantId, quantity } });
    }
    return this.getCart(cartId);
  }

  async updateItem(cartId: string, itemId: string, quantity: number) {
    const item = await this.ensureItemBelongsToCart(cartId, itemId);
    if (quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    }
    return this.getCart(cartId);
  }

  async removeItem(cartId: string, itemId: string) {
    await this.ensureItemBelongsToCart(cartId, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(cartId);
  }

  async mergeGuestCartIntoUser(userId: string, guestSessionId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { sessionId: guestSessionId },
      include: { items: true },
    });
    const userCart = await this.getOrCreateCart(userId);
    if (!guestCart) {
      return this.getCart(userCart.id);
    }

    for (const item of guestCart.items) {
      const existing = await this.prisma.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
      });
      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: { cartId: userCart.id, variantId: item.variantId, quantity: item.quantity },
        });
      }
    }
    await this.prisma.cart.delete({ where: { id: guestCart.id } });
    return this.getCart(userCart.id);
  }

  private async ensureItemBelongsToCart(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cartId) {
      throw new ResourceNotFoundException('CartItem', itemId);
    }
    return item;
  }

  private toCartResponse(cart: CartWithItems) {
    const items = cart.items.map((item) => {
      const unitPrice = Number(item.variant.price);
      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        lineTotal: roundCurrency(unitPrice * item.quantity),
        sku: item.variant.sku,
        size: item.variant.size.label,
        color: item.variant.color.name,
        availableStock: item.variant.stockQuantity - item.variant.reservedQuantity,
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
          slug: item.variant.product.slug,
        },
      };
    });
    const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.lineTotal, 0));
    return { id: cart.id, items, subtotal };
  }
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
