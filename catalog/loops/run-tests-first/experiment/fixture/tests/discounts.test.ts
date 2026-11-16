import { describe, expect, it } from 'vitest';
import { discountRate } from '../src/discounts.js';

describe('discountRate', () => {
  it('is zero without a code', () => {
    expect(discountRate(undefined, '2026-03-01')).toBe(0);
  });

  it('knows the codes', () => {
    expect(discountRate('LOYAL15', '2026-03-01')).toBe(0.15);
  });

  it('refuses a code it does not know', () => {
    expect(() => discountRate('FREE100', '2026-03-01')).toThrow('unknown discount code: FREE100');
  });

  it('refuses WELCOME10 after the launch campaign', () => {
    expect(() => discountRate('WELCOME10', '2026-11-01')).toThrow('ended on 2026-10-31');
  });

  it('takes WELCOME10 on an invoice issued today', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(discountRate('WELCOME10', today)).toBe(0.1);
  });
});
