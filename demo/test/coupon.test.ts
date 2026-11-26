import { describe, expect, it } from 'vitest';
import { applyCoupon, isCouponValid, MAX_PERCENT_DISCOUNT, type Coupon } from '../src/coupon.ts';

const now = new Date('2027-01-28T18:00:00Z');

const coupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  code: 'TEST',
  type: 'percent',
  value: 10,
  minOrder: 50,
  expiresAt: new Date('2999-01-01'),
  ...overrides,
});

describe('isCouponValid', () => {
  it('accepts a coupon that is not expired and meets the minimum order', () => {
    expect(isCouponValid(coupon(), 60, now)).toBe(true);
  });

  it('accepts an order of exactly the minimum amount', () => {
    expect(isCouponValid(coupon(), 50, now)).toBe(true);
  });

  it('rejects an order below the minimum amount', () => {
    expect(isCouponValid(coupon(), 49.99, now)).toBe(false);
  });

  it('rejects an expired coupon', () => {
    expect(isCouponValid(coupon({ expiresAt: new Date('2000-01-01') }), 60, now)).toBe(false);
  });

  it('rejects a coupon at the exact moment it expires', () => {
    expect(isCouponValid(coupon({ expiresAt: now }), 60, now)).toBe(false);
  });
});

describe('applyCoupon', () => {
  it('takes a percentage off', () => {
    expect(applyCoupon(80, coupon({ value: 25 }))).toBe(60);
  });

  it(`caps percent coupons at ${MAX_PERCENT_DISCOUNT}%`, () => {
    expect(applyCoupon(100, coupon({ value: 90 }))).toBe(50);
  });

  it('takes a fixed amount off', () => {
    expect(applyCoupon(100, coupon({ type: 'fixed', value: 20 }))).toBe(80);
  });

  it('never goes below zero', () => {
    expect(applyCoupon(10, coupon({ type: 'fixed', value: 20 }))).toBe(0);
  });

  it('rounds to cents', () => {
    expect(applyCoupon(10, coupon({ value: 33 }))).toBe(6.7);
  });
});
