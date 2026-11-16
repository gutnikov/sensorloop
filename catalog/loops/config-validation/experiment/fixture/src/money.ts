import type { Currency } from './types.js';

/** Rounds an amount to cents, the way the invoices print it. */
export function roundCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function sumAmounts(amounts: number[]): number {
  return roundCents(amounts.reduce((sum, amount) => sum + amount, 0));
}

const digits = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const SIGNS: Record<Currency, string> = { USD: '$', GBP: '£', CAD: 'CA$' };

/** An amount as the reports print it: $1,234.50, £1,234.50, CA$1,234.50, or -£20.00. */
export function formatMoney(amount: number, currency: Currency): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${SIGNS[currency]}${digits.format(Math.abs(amount))}`;
}
