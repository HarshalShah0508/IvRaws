import { OrderStatus } from '../../generated/prisma/enums.js';
import { assertValidOrderTransition } from './order-state-machine.js';

describe('assertValidOrderTransition', () => {
  it('allows PENDING_PAYMENT -> PAID', () => {
    expect(() => assertValidOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID)).not.toThrow();
  });

  it('allows PAID -> PROCESSING -> SHIPPED -> DELIVERED', () => {
    expect(() => assertValidOrderTransition(OrderStatus.PAID, OrderStatus.PROCESSING)).not.toThrow();
    expect(() => assertValidOrderTransition(OrderStatus.PROCESSING, OrderStatus.SHIPPED)).not.toThrow();
    expect(() => assertValidOrderTransition(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).not.toThrow();
  });

  it('rejects skipping states, e.g. PENDING_PAYMENT -> DELIVERED', () => {
    expect(() => assertValidOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.DELIVERED)).toThrow();
  });

  it('rejects any transition out of a terminal state', () => {
    expect(() => assertValidOrderTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED)).toThrow();
    expect(() => assertValidOrderTransition(OrderStatus.CANCELLED, OrderStatus.PAID)).toThrow();
  });

  it('rejects a no-op transition to the same status', () => {
    expect(() => assertValidOrderTransition(OrderStatus.CANCELLED, OrderStatus.CANCELLED)).toThrow();
  });
});
