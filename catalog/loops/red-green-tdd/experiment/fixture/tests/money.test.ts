import { describe, expect, it } from 'vitest';
import { formatMoney, roundCents, sumAmounts } from '../src/money.js';

describe('roundCents', () => {
  it('rounds to the nearest cent', () => {
    expect(roundCents(1.234)).toBe(1.23);
    expect(roundCents(1.236)).toBe(1.24);
  });
});

describe('sumAmounts', () => {
  it('adds without floating-point dust', () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3);
    expect(sumAmounts([])).toBe(0);
  });
});

describe('formatMoney', () => {
  it('prints dollars with thousands separators and cents', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50');
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('puts the minus before the sign', () => {
    expect(formatMoney(-20)).toBe('-$20.00');
  });
});
