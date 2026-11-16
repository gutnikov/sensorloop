import { describe, expect, it } from 'vitest';
import { formatMoney, roundCents, sumAmounts } from '../src/money.js';

describe('roundCents', () => {
  it('rounds half a cent up', () => {
    expect(roundCents(1.005)).toBe(1.01);
    expect(roundCents(2.675)).toBe(2.68);
  });
});

describe('sumAmounts', () => {
  it('adds without floating-point dust', () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumAmounts([])).toBe(0);
  });
});

describe('formatMoney', () => {
  it('prints dollars and cents', () => {
    expect(formatMoney(1234.5)).toBe('$1234.50');
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('puts the minus before the sign', () => {
    expect(formatMoney(-20)).toBe('-$20.00');
  });
});
