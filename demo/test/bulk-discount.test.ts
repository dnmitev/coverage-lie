import { describe, expect, it } from 'vitest';
import { BULK_QUANTITY, lineTotal, subtotal } from '../src/cart.ts';

const socks = (quantity: number, price = 10) => ({ name: 'Socks', price, quantity });

describe('lineTotal', () => {
  it('charges full price below the bulk quantity', () => {
    expect(lineTotal(socks(BULK_QUANTITY - 1))).toBe(20);
  });

  it('gives 10% off at exactly the bulk quantity', () => {
    expect(lineTotal(socks(BULK_QUANTITY))).toBe(27);
  });

  it('gives 10% off above the bulk quantity', () => {
    expect(lineTotal(socks(5))).toBe(45);
  });

  it('rounds the discounted line to cents', () => {
    expect(lineTotal(socks(3, 3.33))).toBe(8.99);
  });
});

describe('subtotal with bulk lines', () => {
  it('discounts only the bulk line', () => {
    expect(subtotal([socks(3), { name: 'Hat', price: 15, quantity: 1 }])).toBe(42);
  });
});
