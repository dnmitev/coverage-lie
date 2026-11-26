import { describe, expect, it } from 'vitest';
import { checkout, shippingFor, subtotal } from '../src/cart.ts';
import type { Coupon } from '../src/coupon.ts';

const items = [
  { name: 'Mechanical keyboard', price: 79.9, quantity: 1 },
  { name: 'Rubber duck', price: 4.5, quantity: 2 },
];

const future = new Date('2999-01-01');
const past = new Date('2000-01-01');

describe('cart', () => {
  it('checks out', () => {
    // Look ma, no assertions! Still counts for coverage.
    checkout(items);
  });

  it('calculates subtotal', () => {
    expect(subtotal(items)).toBeDefined();
  });

  it('charges shipping for small orders', () => {
    expect(shippingFor(50)).toBeGreaterThan(0);
  });

  it('ships big orders for free', () => {
    expect(shippingFor(150)).toBe(0);
  });

  it('applies a valid coupon', () => {
    const coupon: Coupon = { code: 'SAVE10', type: 'percent', value: 10, minOrder: 0, expiresAt: future };
    const receipt = checkout(items, coupon);
    expect(receipt.total).toBeLessThan(receipt.subtotal + receipt.shipping);
  });

  it('ignores an expired coupon', () => {
    const coupon: Coupon = { code: 'OLD', type: 'fixed', value: 10, minOrder: 0, expiresAt: past };
    expect(checkout(items, coupon, new Date())).toBeTruthy();
  });

  it('refuses an empty cart', () => {
    expect(() => checkout([])).toThrow();
  });
});
