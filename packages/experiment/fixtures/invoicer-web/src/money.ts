/** Rounds an amount to cents, the way the invoices print it. */
export function roundCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function sumAmounts(amounts: number[]): number {
  return roundCents(amounts.reduce((sum, amount) => sum + amount, 0));
}

const digits = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** An amount as the pages show it: $1,234.50, or -$20.00. */
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${digits.format(Math.abs(amount))}`;
}
