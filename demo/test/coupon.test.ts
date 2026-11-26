import { describe, expect, it } from 'vitest';
import { applyCoupon, isCouponValid, type Coupon } from '../src/coupon.ts';

const coupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  code: 'TEST',
  type: 'percent',
  value: 10,
  minOrder: 0,
  expiresAt: new Date('2999-01-01'),
  ...overrides,
});

describe('coupon', () => {
  it('validates coupons', () => {
    expect(typeof isCouponValid(coupon(), 100, new Date())).toBe('boolean');
  });

  it('applies percent coupons', () => {
    expect(applyCoupon(100, coupon())).toBeLessThan(100);
  });

  it('caps huge percent coupons', () => {
    expect(applyCoupon(100, coupon({ value: 90 }))).toBeGreaterThan(0);
  });

  it('applies fixed coupons', () => {
    expect(applyCoupon(100, coupon({ type: 'fixed', value: 20 }))).toBeLessThan(100);
  });

  it('never goes below zero', () => {
    expect(applyCoupon(10, coupon({ type: 'fixed', value: 20 }))).toBeGreaterThanOrEqual(0);
  });
});
