import { describe, expect, it } from 'vitest';
import { checkout, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, shippingFor, subtotal } from '../src/cart.ts';
import type { Coupon } from '../src/coupon.ts';

const items = [
  { name: 'Mechanical keyboard', price: 79.9, quantity: 1 },
  { name: 'Rubber duck', price: 4.5, quantity: 2 },
];

const now = new Date('2027-01-28T18:00:00Z');
const future = new Date('2999-01-01');
const past = new Date('2000-01-01');

const coupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  code: 'SAVE10',
  type: 'percent',
  value: 10,
  minOrder: 0,
  expiresAt: future,
  ...overrides,
});

describe('subtotal', () => {
  it('multiplies price by quantity and sums', () => {
    expect(subtotal(items)).toBe(88.9);
  });
});

describe('shippingFor', () => {
  it('charges the fee below the threshold', () => {
    expect(shippingFor(99.99)).toBe(SHIPPING_FEE);
  });

  it('ships for free at exactly the threshold', () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD)).toBe(0);
  });

  it('ships for free above the threshold', () => {
    expect(shippingFor(100.01)).toBe(0);
  });
});

describe('checkout', () => {
  it('returns a full receipt', () => {
    expect(checkout(items, undefined, now)).toEqual({
      subtotal: 88.9,
      discount: 0,
      shipping: SHIPPING_FEE,
      total: 94.89,
    });
  });

  it('applies a valid coupon before shipping', () => {
    expect(checkout(items, coupon(), now)).toEqual({
      subtotal: 88.9,
      discount: 8.89,
      shipping: SHIPPING_FEE,
      total: 86,
    });
  });

  it('ignores an expired coupon', () => {
    expect(checkout(items, coupon({ expiresAt: past }), now).discount).toBe(0);
  });

  it('refuses an empty cart with a helpful message', () => {
    expect(() => checkout([])).toThrow('Cart is empty');
  });
});
