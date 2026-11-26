import { z } from 'zod';
import type { Coupon } from './coupon.ts';

/** Coupons created through the admin API. Everything from the outside world goes through this schema. */
export const CouponInput = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,20}$/, 'Code must be 3-20 letters or digits'),
    type: z.enum(['percent', 'fixed']),
    value: z.number().positive().max(1000),
    minOrder: z.number().min(0).default(0),
    expiresAt: z.coerce.date(),
  })
  .refine((c) => c.type !== 'percent' || c.value <= 100, {
    message: 'Percent coupons cannot exceed 100%',
    path: ['value'],
  });

export function parseCoupon(input: unknown): Coupon {
  return CouponInput.parse(input);
}
