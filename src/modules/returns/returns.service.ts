import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { OrderStatus, ReturnRequestStatus } from '../../generated/prisma/enums.js';
import { ResourceNotFoundException } from '../../common/exceptions/domain.exceptions.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { ReturnRequestFilterDto } from './dto/return-request-filter.dto.js';

const ALLOWED_TRANSITIONS: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
  [ReturnRequestStatus.REQUESTED]: [ReturnRequestStatus.APPROVED, ReturnRequestStatus.REJECTED],
  [ReturnRequestStatus.APPROVED]: [ReturnRequestStatus.REFUNDED],
  [ReturnRequestStatus.REJECTED]: [],
  [ReturnRequestStatus.REFUNDED]: [],
};

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createForUser(userId: string, orderId: string, reason: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId }, include: { user: true } });
    if (!order) {
      throw new ResourceNotFoundException('Order', orderId);
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Returns can only be requested for delivered orders');
    }

    const existing = await this.prisma.returnRequest.findFirst({
      where: { orderId, status: { in: [ReturnRequestStatus.REQUESTED, ReturnRequestStatus.APPROVED] } },
    });
    if (existing) {
      throw new ConflictException('A return request is already in progress for this order');
    }

    const created = await this.prisma.returnRequest.create({ data: { orderId, userId, reason } });
    await this.notificationsService.sendReturnRequestReceived({
      to: order.user.email,
      orderNumber: order.orderNumber,
    });
    return created;
  }

  findAllAdmin(filter: ReturnRequestFilterDto) {
    return this.prisma.returnRequest.findMany({
      where: { status: filter.status },
      orderBy: { createdAt: 'desc' },
      include: { order: true, user: { select: { id: true, email: true } } },
    });
  }

  async findOneAdmin(id: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { include: { items: true } }, user: { select: { id: true, email: true } } },
    });
    if (!request) {
      throw new ResourceNotFoundException('ReturnRequest', id);
    }
    return request;
  }

  async updateStatusAdmin(id: string, nextStatus: ReturnRequestStatus, adminNote?: string) {
    const request = await this.findOneAdmin(id);
    if (!ALLOWED_TRANSITIONS[request.status]?.includes(nextStatus)) {
      throw new BadRequestException(`Cannot transition return request from ${request.status} to ${nextStatus}`);
    }

    // Gateway call happens before any DB mutation: if it throws, nothing here
    // has changed yet, so the admin can safely retry the same PATCH. Doing the
    // restock/order-status/return-status writes first (as originally written)
    // left the ReturnRequest stuck at APPROVED with stock already restocked
    // when the gateway call failed — an inconsistent state a retry would then
    // double-restock.
    if (nextStatus === ReturnRequestStatus.REFUNDED) {
      await this.paymentsService.refundPayment(request.orderId);
    }

    const resolved = nextStatus === ReturnRequestStatus.REJECTED || nextStatus === ReturnRequestStatus.REFUNDED;
    await this.prisma.$transaction(async (tx) => {
      if (nextStatus === ReturnRequestStatus.REFUNDED) {
        for (const item of request.order.items) {
          await this.inventoryService.restock(tx, item.variantId, item.quantity);
        }
        await tx.order.update({ where: { id: request.orderId }, data: { status: OrderStatus.REFUNDED } });
      }
      await tx.returnRequest.update({
        where: { id },
        data: { status: nextStatus, adminNote, resolvedAt: resolved ? new Date() : undefined },
      });
    });

    await this.notificationsService.sendReturnStatusUpdate({
      to: request.user.email,
      orderNumber: request.order.orderNumber,
      status: nextStatus,
    });

    return this.findOneAdmin(id);
  }
}
