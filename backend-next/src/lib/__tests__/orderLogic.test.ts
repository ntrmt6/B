import { describe, it, expect } from 'vitest';
import {
  computeOrderTotal,
  isValidStatusTransition,
  isBakiPayable,
  snapshotItem,
  NEXT_STATUS,
  OrderItemInput,
} from '../orderLogic';

describe('orderLogic — price snapshots (immutable totals)', () => {
  it('totals items from the priceAt snapshot, not from a live menu price', () => {
    const items: OrderItemInput[] = [
      { nameBn: 'দুধ চা', priceAt: 10, qty: 3 },
      { nameBn: 'কফি', priceAt: 15, qty: 2 },
    ];
    expect(computeOrderTotal(items)).toBe(60);
  });

  it('changing a menu price later does NOT alter a previously placed order total', () => {
    const placed: OrderItemInput[] = [{ nameBn: 'দুধ চা', priceAt: 10, qty: 5 }];
    const totalAtPlacement = computeOrderTotal(placed);
    // Simulate the shop owner raising the menu price after the fact.
    const updatedMenuPrice = 12; // menu edit — nothing to do with `placed`
    void updatedMenuPrice;
    // The snapshot on the order is unchanged, so total stays fixed.
    expect(computeOrderTotal(placed)).toBe(totalAtPlacement);
    expect(computeOrderTotal(placed)).toBe(50);
  });

  it('handles empty item list, negative prices, and non-numeric qty defensively', () => {
    expect(computeOrderTotal([])).toBe(0);
    expect(computeOrderTotal([{ nameBn: 'x', priceAt: -5, qty: 3 }])).toBe(0);
    expect(computeOrderTotal([{ nameBn: 'x', priceAt: 10, qty: NaN as any }])).toBe(0);
  });

  it('snapshotItem trims and clamps input safely', () => {
    expect(snapshotItem({ nameBn: '  চা  ', priceAt: 10, qty: 2 })).toEqual({
      menuItemId: undefined,
      nameBn: 'চা',
      priceAt: 10,
      qty: 2,
      note: undefined,
    });
    expect(snapshotItem({ nameBn: '', priceAt: 10, qty: 1 })).toBeNull();
    expect(snapshotItem({ nameBn: 'চা', priceAt: 10, qty: 5000 })?.qty).toBe(999);
    expect(snapshotItem({ nameBn: 'চা', priceAt: 10, qty: 0 })?.qty).toBe(1);
  });
});

describe('orderLogic — status transitions', () => {
  it('allows only the documented graph', () => {
    expect(isValidStatusTransition('new', 'making')).toBe(true);
    expect(isValidStatusTransition('new', 'cancelled')).toBe(true);
    expect(isValidStatusTransition('making', 'ready')).toBe(true);
    expect(isValidStatusTransition('making', 'cancelled')).toBe(true);
  });

  it('rejects skipping states', () => {
    expect(isValidStatusTransition('new', 'ready')).toBe(false);
  });

  it('rejects moves out of terminal states', () => {
    expect(isValidStatusTransition('ready', 'making')).toBe(false);
    expect(isValidStatusTransition('ready', 'new')).toBe(false);
    expect(isValidStatusTransition('cancelled', 'new')).toBe(false);
    expect(isValidStatusTransition('cancelled', 'making')).toBe(false);
  });

  it('rejects same-state transitions', () => {
    (['new', 'making', 'ready', 'cancelled'] as const).forEach(s => {
      expect(isValidStatusTransition(s, s)).toBe(false);
    });
  });

  it('terminal states have no outgoing edges', () => {
    expect(NEXT_STATUS.ready).toEqual([]);
    expect(NEXT_STATUS.cancelled).toEqual([]);
  });
});

describe('orderLogic — baki linking guard', () => {
  it('non-baki payments never require an entityId', () => {
    expect(isBakiPayable('nagad', undefined)).toBe(true);
    expect(isBakiPayable('bkash', '')).toBe(true);
  });

  it('baki requires a non-empty entityId (this is what links the order into the khata)', () => {
    expect(isBakiPayable('baki', undefined)).toBe(false);
    expect(isBakiPayable('baki', '')).toBe(false);
    expect(isBakiPayable('baki', '507f1f77bcf86cd799439011')).toBe(true);
  });
});
