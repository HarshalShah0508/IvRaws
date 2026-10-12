import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { OrderStatus, PaymentGateway, PaymentStatus } from '../../generated/prisma/enums.js';
import { InsufficientStockException, ResourceNotFoundException } from '../../common/exceptions/domain.exceptions.js';
import { CartService } from '../cart/cart.service.js';
import { AddressesService } from '../addresses/addresses.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { DiscountsService } from '../discounts/discounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RESERVATION_QUEUE, RESERVATION_TIMEOUT_MS } from '../../jobs/queues/reservation.queue.js';
import { assertValidOrderTransition } from './order-state-machine.js';
import type { CheckoutDto } from './dto/checkout.dto.js';
import type { AdminOrderFilterDto } from './dto/admin-order-filter.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly addressesService: AddressesService,
    private readonly inventoryService: InventoryService,
    private readonly paymentsService: PaymentsService,
    private readonly discountsService: DiscountsService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue(RESERVATION_QUEUE) private readonly reservationQueue: Queue,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    await this.addressesService.findOneForUser(userId, dto.shippingAddressId);
    if (dto.billingAddressId) {
      await this.addressesService.findOneForUser(userId, dto.billingAddressId);
    }

    const cartRow = await this.cartService.getOrCreateCart(userId);
    const cart = await this.cartService.getCart(cartRow.id);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const orderNumber = this.generateOrderNumber();

    const discount = dto.couponCode ? await this.discountsService.validate(dto.couponCode, cart.subtotal) : null;
    const discountAmount = discount?.discountAmount ?? 0;
    const total = Math.round((cart.subtotal - discountAmount) * 100) / 100;

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const reserved = await this.inventoryService.reserveStock(tx, item.variantId, item.quantity);
        if (!reserved) {
          throw new InsufficientStockException(item.sku);
        }
      }

      if (discount) {
        await tx.coupon.update({ where: { id: discount.coupon.id }, data: { usedCount: { increment: 1 } } });
      }

      return tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PENDING_PAYMENT,
          subtotal: cart.subtotal,
          discountAmount,
          total,
          shippingAddressId: dto.shippingAddressId,
          couponId: discount?.coupon.id,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              productName: item.product.name,
              variantSku: item.sku,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      });
    });

    await this.prisma.cartItem.deleteMany({ where: { cartId: cartRow.id } });

    // Scheduled before the payment-gateway call so the reservation is always
    // backed by a safety net: if initiatePayment throws (e.g. gateway outage),
    // this job still fires later and releases the stock instead of leaking it.
    await this.reservationQueue.add(
      'expire-reservation',
      { orderId: order.id },
      { delay: RESERVATION_TIMEOUT_MS },
    );

    const gateway = dto.gateway ?? PaymentGateway.STRIPE;
    const payment = await this.paymentsService.initiatePayment(order, gateway, 'inr');

    return { order, payment };
  }

  async applyPaymentOutcome(orderId: string, status: PaymentStatus): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { variant: { select: { productId: true } } } }, user: true },
    });
    if (!order || order.status !== OrderStatus.PENDING_PAYMENT) {
      return;
    }

    if (status === PaymentStatus.SUCCEEDED) {
      await this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await this.inventoryService.commitSale(tx, item.variantId, item.quantity);
          await tx.product.update({
            where: { id: item.variant.productId },
            data: { salesCount: { increment: item.quantity } },
          });
        }
        await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.PAID } });
      });
      await this.notificationsService.sendOrderConfirmation({
        to: order.user.email,
        orderNumber: order.orderNumber,
        total: order.total.toString(),
      });
    } else if (status === PaymentStatus.FAILED) {
      await this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await this.inventoryService.releaseReservation(tx, item.variantId, item.quantity);
        }
        await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.PAYMENT_FAILED } });
      });
    }
  }

  async releaseExpiredReservation(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status !== OrderStatus.PENDING_PAYMENT) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await this.inventoryService.releaseReservation(tx, item.variantId, item.quantity);
      }
      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.CANCELLED } });
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, payment: true },
    });
  }

  async findOneForUser(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, payment: true, shippingAddress: true },
    });
    if (!order) {
      throw new ResourceNotFoundException('Order', id);
    }
    return order;
  }

  async cancel(userId: string, id: string) {
    const order = await this.findOneForUser(userId, id);
    assertValidOrderTransition(order.status, OrderStatus.CANCELLED);

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (order.status === OrderStatus.PENDING_PAYMENT) {
          await this.inventoryService.releaseReservation(tx, item.variantId, item.quantity);
        } else if (order.status === OrderStatus.PAID) {
          await this.inventoryService.restock(tx, item.variantId, item.quantity);
        }
      }
      await tx.order.update({ where: { id }, data: { status: OrderStatus.CANCELLED } });
    });

    return this.findOneForUser(userId, id);
  }

  findAllAdmin(filter: AdminOrderFilterDto) {
    return this.prisma.order.findMany({
      where: {
        status: filter.status,
        createdAt: {
          gte: filter.from ? new Date(filter.from) : undefined,
          lte: filter.to ? new Date(filter.to) : undefined,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { items: true, payment: true, user: { select: { id: true, email: true } } },
    });
  }

  async findOneAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true, shippingAddress: true, user: { select: { id: true, email: true } } },
    });
    if (!order) {
      throw new ResourceNotFoundException('Order', id);
    }
    return order;
  }

  async updateStatusAdmin(id: string, nextStatus: OrderStatus) {
    const order = await this.findOneAdmin(id);
    assertValidOrderTransition(order.status, nextStatus);

    await this.prisma.$transaction(async (tx) => {
      if (nextStatus === OrderStatus.CANCELLED || nextStatus === OrderStatus.REFUNDED) {
        for (const item of order.items) {
          if (order.status === OrderStatus.PENDING_PAYMENT) {
            await this.inventoryService.releaseReservation(tx, item.variantId, item.quantity);
          } else {
            await this.inventoryService.restock(tx, item.variantId, item.quantity);
          }
        }
      }
      await tx.order.update({ where: { id }, data: { status: nextStatus } });
    });

    if (nextStatus === OrderStatus.SHIPPED) {
      await this.notificationsService.sendOrderShipped({ to: order.user.email, orderNumber: order.orderNumber });
    }

    return this.findOneAdmin(id);
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = randomUUID().slice(0, 6).toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
  }
}
