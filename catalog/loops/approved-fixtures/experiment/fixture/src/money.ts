/** Rounds an amount to cents, the way the invoices print it. */
export function roundCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function sumAmounts(amounts: number[]): number {
  return roundCents(amounts.reduce((sum, amount) => sum + amount, 0));
}

const digits = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });

/** An amount with two decimals and no sign: 1234.50. */
export function formatAmount(amount: number): string {
  return digits.format(Math.abs(amount));
}

/** An amount as the reports print it: $1234.50, or -$20.00. */
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${formatAmount(amount)}`;
}
