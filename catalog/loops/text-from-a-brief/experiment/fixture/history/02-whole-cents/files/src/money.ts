/** Rounds an amount to cents, the way the invoices print it. */
export function roundCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Adds amounts as whole cents, so that no rounding happens inside the sum. */
export function sumAmounts(amounts: number[]): number {
  const cents = amounts.reduce((sum, amount) => sum + Math.round((amount + Number.EPSILON) * 100), 0);
  return cents / 100;
}

const digits = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** An amount as the reports print it: $1,234.50, or -$20.00. */
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${digits.format(Math.abs(amount))}`;
}
