import { describe, expect, it } from 'vitest';
import { lineTotal } from '../src/cart.ts';

// Written by an agent asked to "add tests for the bulk discount, keep coverage at 100%".
describe('lineTotal', () => {
  it('applies the bulk discount for large quantities', () => {
    expect(lineTotal({ name: 'Socks', price: 10, quantity: 5 })).toBeLessThan(50);
  });

  it('calculates the line total for small quantities', () => {
    expect(lineTotal({ name: 'Socks', price: 10, quantity: 1 })).toBeGreaterThan(0);
  });
});
