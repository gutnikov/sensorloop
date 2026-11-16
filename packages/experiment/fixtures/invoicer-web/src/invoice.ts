import { roundCents, sumAmounts } from './money.js';
import type { Invoice } from './types.js';

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export function totals(invoice: Invoice): InvoiceTotals {
  const subtotal = sumAmounts(invoice.items.map((item) => item.quantity * item.unitPrice));
  const tax = roundCents(subtotal * invoice.taxRate);
  return { subtotal, tax, total: roundCents(subtotal + tax) };
}

export type Status = 'Paid' | 'Overdue' | 'Unpaid';

/** Paid; Overdue when unpaid after its due date; Unpaid until then. */
export function status(invoice: Invoice, today: string): Status {
  if (invoice.paid) return 'Paid';
  return invoice.dueOn < today ? 'Overdue' : 'Unpaid';
}
