import { describe, expect, it } from 'vitest';
import { discountRate } from '../src/discounts.js';

describe('discountRate', () => {
  it('is zero without a code', () => {
    expect(discountRate(undefined)).toBe(0);
  });

  it('knows the codes', () => {
    expect(discountRate('LOYAL15')).toBe(0.15);
  });

  it('refuses a code it does not know', () => {
    expect(() => discountRate('FREE100')).toThrow('unknown discount code: FREE100');
  });
});
