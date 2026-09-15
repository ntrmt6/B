// Pure business rules for the order flow.
// Kept dependency-free so it can be unit-tested without Mongo or Express.

export type OrderStatus = 'new' | 'making' | 'ready' | 'cancelled';
export type OrderPayment = 'nagad' | 'bkash' | 'baki';

export interface OrderItemInput {
  menuItemId?: string;
  nameBn: string;
  priceAt: number;
  qty: number;
  note?: string;
}

// Legal status transitions.
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  new: ['making', 'cancelled'],
  making: ['ready', 'cancelled'],
  ready: [],
  cancelled: [],
};

export function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT_STATUS[from]?.includes(to) ?? false;
}

// Sum the snapshot totals — this is what makes prices immutable once an
// order is placed. Later menu edits change MenuItem.price but never touch
// the priceAt values already stored on the Order document.
export function computeOrderTotal(items: OrderItemInput[]): number {
  let total = 0;
  for (const it of items) {
    const qty = Math.max(0, Math.floor(Number(it.qty) || 0));
    const price = Math.max(0, Number(it.priceAt) || 0);
    total += qty * price;
  }
  return total;
}

// Baki orders require an entityId so we can attach the amount to the
// customer's due total via the existing Transaction flow.
export function isBakiPayable(paymentMethod: OrderPayment, entityId: string | undefined): boolean {
  if (paymentMethod !== 'baki') return true;
  return typeof entityId === 'string' && entityId.length > 0;
}

// Normalise a snapshot item as stored on the order.
export function snapshotItem(raw: OrderItemInput): OrderItemInput | null {
  const nameBn = (raw.nameBn || '').toString().trim().slice(0, 80);
  if (!nameBn) return null;
  const priceAt = Math.max(0, Number(raw.priceAt) || 0);
  const qty = Math.max(1, Math.min(999, Math.floor(Number(raw.qty) || 1)));
  const note = typeof raw.note === 'string' ? raw.note.trim().slice(0, 120) : undefined;
  return { menuItemId: raw.menuItemId, nameBn, priceAt, qty, note };
}
