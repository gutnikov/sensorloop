/** Discount codes: the fraction of the subtotal each takes off, and the last day an invoice may be issued with it. */
export const DISCOUNTS: Record<string, { rate: number; until?: string }> = {
  WELCOME10: { rate: 0.1, until: '2026-10-31' },
  LOYAL15: { rate: 0.15 },
  PARTNER25: { rate: 0.25 },
};

/** The fraction a code takes off an invoice issued on the given day (YYYY-MM-DD). */
export function discountRate(code: string | undefined, issuedOn: string): number {
  if (code === undefined) return 0;
  const discount = DISCOUNTS[code];
  if (discount === undefined) throw new Error(`unknown discount code: ${code}`);
  if (discount.until !== undefined && issuedOn > discount.until) {
    throw new Error(`discount code ${code} ended on ${discount.until}`);
  }
  return discount.rate;
}
