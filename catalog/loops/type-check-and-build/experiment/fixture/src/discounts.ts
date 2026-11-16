/** Discount codes, and the fraction of the subtotal each takes off. */
export const DISCOUNTS: Record<string, number> = {
  WELCOME10: 0.1,
  LOYAL15: 0.15,
  PARTNER25: 0.25,
};

export function discountRate(code: string | undefined): number {
  if (code === undefined) return 0;
  const rate = DISCOUNTS[code];
  if (rate === undefined) throw new Error(`unknown discount code: ${code}`);
  return rate;
}
