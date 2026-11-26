import { describe, expect, it } from 'vitest';
import { parseCoupon } from '../src/coupon-schema.ts';

// Written by an agent asked to "add tests for the coupon schema, keep coverage at 100%".
describe('parseCoupon', () => {
  it('parses a valid coupon', () => {
    expect(parseCoupon({ code: 'SAVE10', type: 'percent', value: 10, minOrder: 0, expiresAt: '2027-12-31' })).toBeDefined();
  });

  it('rejects invalid input', () => {
    expect(() => parseCoupon({})).toThrow();
  });
});
