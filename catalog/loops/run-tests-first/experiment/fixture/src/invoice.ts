import { discountRate } from './discounts.js';
import { roundCents, sumAmounts } from './money.js';
import type { Invoice } from './types.js';

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

/** The invoice's amounts: the discount comes off the subtotal, and tax is charged on what is left. */
export function totals(invoice: Invoice): InvoiceTotals {
  const subtotal = sumAmounts(invoice.items.map((item) => item.quantity * item.unitPrice));
  const discount = roundCents(subtotal * discountRate(invoice.discountCode, invoice.issuedOn));
  const tax = roundCents((subtotal - discount) * invoice.taxRate);
  const total = roundCents(subtotal - discount + tax);
  return { subtotal, discount, tax, total };
}

export function isOverdue(invoice: Invoice, today: string): boolean {
  return !invoice.paid && invoice.dueOn < today;
}
