import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReturnsService } from './returns.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { OrderStatus, ReturnRequestStatus } from '../../generated/prisma/enums.js';

describe('ReturnsService.updateStatusAdmin', () => {
  let returnsService: ReturnsService;
  let prisma: {
    returnRequest: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    order: { update: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let inventoryService: { restock: ReturnType<typeof vi.fn> };
  let paymentsService: { refundPayment: ReturnType<typeof vi.fn> };
  let notificationsService: { sendReturnStatusUpdate: ReturnType<typeof vi.fn> };

  const baseRequest = {
    id: 'rr-1',
    orderId: 'order-1',
    status: ReturnRequestStatus.APPROVED,
    order: { orderNumber: 'ORD-1', items: [{ variantId: 'variant-1', quantity: 2 }] },
    user: { email: 'customer@example.com' },
  };

  beforeEach(async () => {
    prisma = {
      returnRequest: {
        findUnique: vi.fn().mockResolvedValue(baseRequest),
        update: vi.fn().mockResolvedValue({}),
      },
      order: { update: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
    };
    inventoryService = { restock: vi.fn().mockResolvedValue(undefined) };
    paymentsService = { refundPayment: vi.fn() };
    notificationsService = { sendReturnStatusUpdate: vi.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: PrismaService, useValue: prisma },
        { provide: InventoryService, useValue: inventoryService },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    returnsService = moduleRef.get(ReturnsService);
  });

  it('rejects an invalid transition (REQUESTED -> REFUNDED, skipping APPROVED)', async () => {
    prisma.returnRequest.findUnique.mockResolvedValue({ ...baseRequest, status: ReturnRequestStatus.REQUESTED });

    await expect(
      returnsService.updateStatusAdmin('rr-1', ReturnRequestStatus.REFUNDED),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(paymentsService.refundPayment).not.toHaveBeenCalled();
  });

  it('on the happy path: calls the gateway refund, then restocks and updates both statuses', async () => {
    paymentsService.refundPayment.mockResolvedValue(undefined);

    await returnsService.updateStatusAdmin('rr-1', ReturnRequestStatus.REFUNDED);

    expect(paymentsService.refundPayment).toHaveBeenCalledWith('order-1');
    expect(inventoryService.restock).toHaveBeenCalledWith(prisma, 'variant-1', 2);
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: OrderStatus.REFUNDED },
    });
    expect(prisma.returnRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: ReturnRequestStatus.REFUNDED }) }),
    );
    expect(notificationsService.sendReturnStatusUpdate).toHaveBeenCalled();
  });

  it('when the gateway refund fails, leaves stock/order/return-request completely untouched (safe to retry)', async () => {
    paymentsService.refundPayment.mockRejectedValue(new Error('Stripe auth failed'));

    await expect(returnsService.updateStatusAdmin('rr-1', ReturnRequestStatus.REFUNDED)).rejects.toThrow(
      'Stripe auth failed',
    );

    expect(inventoryService.restock).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.returnRequest.update).not.toHaveBeenCalled();
    expect(notificationsService.sendReturnStatusUpdate).not.toHaveBeenCalled();
  });
});
