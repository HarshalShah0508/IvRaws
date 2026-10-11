import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

export class InsufficientStockException extends ConflictException {
  constructor(sku: string) {
    super(`Insufficient stock for SKU ${sku}`);
  }
}

export class InvalidCouponException extends UnprocessableEntityException {
  constructor(reason: string) {
    super(`Coupon invalid: ${reason}`);
  }
}

export class InvalidOrderTransitionException extends UnprocessableEntityException {
  constructor(from: string, to: string) {
    super(`Cannot transition order from ${from} to ${to}`);
  }
}

export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
  }
}
