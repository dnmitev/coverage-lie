import { applyCoupon, isCouponValid, type Coupon } from './coupon.ts';
import { roundMoney } from './money.ts';

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Receipt {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

/** Spec: orders of 100 or more ship for free. */
export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_FEE = 5.99;

/** Buy 3 or more of the same item and get 10% off that line. */
export const BULK_QUANTITY = 3;
export const BULK_DISCOUNT_PERCENT = 10;

export function lineTotal(item: CartItem): number {
  const gross = item.price * item.quantity;
  if (item.quantity >= BULK_QUANTITY) {
    return roundMoney(gross - (gross * BULK_DISCOUNT_PERCENT) / 100);
  }
  return roundMoney(gross);
}

export function subtotal(items: CartItem[]): number {
  return roundMoney(items.reduce((sum, item) => sum + lineTotal(item), 0));
}

export function shippingFor(amount: number): number {
  return amount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function checkout(items: CartItem[], coupon?: Coupon, now = new Date()): Receipt {
  if (items.length === 0) {
    throw new Error('Cart is empty');
  }
  const sub = subtotal(items);
  const discounted = coupon && isCouponValid(coupon, sub, now) ? applyCoupon(sub, coupon) : sub;
  const shipping = shippingFor(discounted);
  return {
    subtotal: sub,
    discount: roundMoney(sub - discounted),
    shipping,
    total: roundMoney(discounted + shipping),
  };
}
