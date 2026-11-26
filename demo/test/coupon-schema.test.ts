import { describe, expect, it } from 'vitest';
import { CouponInput, parseCoupon } from '../src/coupon-schema.ts';

const valid = { code: 'SAVE10', type: 'percent', value: 10, minOrder: 50, expiresAt: '2027-12-31' };
const issues = (input: unknown) => CouponInput.safeParse(input).error?.issues.map((i) => ({ path: i.path, message: i.message }));

describe('parseCoupon', () => {
  it('returns a typed coupon', () => {
    expect(parseCoupon(valid)).toEqual({ ...valid, expiresAt: new Date('2027-12-31') });
  });

  it('normalizes the code: trims and upper-cases', () => {
    expect(parseCoupon({ ...valid, code: '  save10 ' }).code).toBe('SAVE10');
  });

  it('defaults minOrder to 0', () => {
    const { minOrder, ...withoutMinOrder } = valid;
    expect(parseCoupon(withoutMinOrder).minOrder).toBe(0);
  });

  it('accepts fixed coupons above 100', () => {
    expect(parseCoupon({ ...valid, type: 'fixed', value: 500 }).value).toBe(500);
  });
});

describe('code', () => {
  it.each(['ABC', 'A'.repeat(20)])('accepts %s', (code) => {
    expect(parseCoupon({ ...valid, code }).code).toBe(code);
  });

  it.each(['AB', 'A'.repeat(21), 'AB-CDE', 'ABC-DE', 'SAVE 10'])('rejects %s with a helpful message', (code) => {
    expect(issues({ ...valid, code })).toEqual([{ path: ['code'], message: 'Code must be 3-20 letters or digits' }]);
  });
});

describe('type, value, minOrder', () => {
  it('rejects an unknown type', () => {
    expect(issues({ ...valid, type: 'bogus' })?.[0].path).toEqual(['type']);
  });

  it.each([0, -5, 1001])('rejects value %s', (value) => {
    expect(issues({ ...valid, type: 'fixed', value })?.[0].path).toEqual(['value']);
  });

  it('rejects a negative minOrder', () => {
    expect(issues({ ...valid, minOrder: -1 })?.[0].path).toEqual(['minOrder']);
  });
});

describe('percent coupons', () => {
  it('accepts exactly 100%', () => {
    expect(parseCoupon({ ...valid, value: 100 }).value).toBe(100);
  });

  it('rejects more than 100%', () => {
    expect(issues({ ...valid, value: 101 })).toEqual([{ path: ['value'], message: 'Percent coupons cannot exceed 100%' }]);
  });
});
