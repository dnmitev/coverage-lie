import { roundMoney } from './money.ts';

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  /** Minimum order amount (inclusive) for the coupon to apply. */
  minOrder: number;
  expiresAt: Date;
}

/** Percent coupons are capped, marketing loves "90% off" typos. */
export const MAX_PERCENT_DISCOUNT = 50;

export function isCouponValid(coupon: Coupon, orderAmount: number, now: Date): boolean {
  return coupon.expiresAt > now && orderAmount >= coupon.minOrder;
}

export function applyCoupon(amount: number, coupon: Coupon): number {
  if (coupon.type === 'percent') {
    const percent = Math.min(coupon.value, MAX_PERCENT_DISCOUNT);
    return roundMoney(amount - (amount * percent) / 100);
  }
  if (coupon.value >= amount) {
    return 0; // the order is on the house
  }
  return roundMoney(amount - coupon.value);
}
