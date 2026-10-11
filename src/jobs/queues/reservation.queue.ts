export const RESERVATION_QUEUE = 'reservation-expiry';
export const RESERVATION_TIMEOUT_MS = 15 * 60 * 1000;

export interface ExpireReservationJobData {
  orderId: string;
}
