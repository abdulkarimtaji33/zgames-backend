export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  PROCESSING = 'processing',
  PACKED = 'packed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  RETURNED = 'returned',
  EXCHANGE_REQUESTED = 'exchange_requested',
  EXCHANGE_APPROVED = 'exchange_approved',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  FAILED = 'failed',
}
