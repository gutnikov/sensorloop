import { totals } from '../invoice.js';
import { sumAmounts } from '../money.js';
import type { Invoice } from '../types.js';

export interface CustomerLine {
  customer: string;
  invoices: number;
  billed: number;
  outstanding: number;
}

export interface Summary {
  invoices: number;
  billed: number;
  paid: number;
  outstanding: number;
  /** Largest outstanding balance first. */
  customers: CustomerLine[];
}

/** What was billed, what was paid and what is still owed, overall and per customer. */
export function summarize(invoices: Invoice[]): Summary {
  const byCustomer = new Map<string, Invoice[]>();
  for (const invoice of invoices) {
    const list = byCustomer.get(invoice.customer.name) ?? [];
    list.push(invoice);
    byCustomer.set(invoice.customer.name, list);
  }
  const customers = [...byCustomer].map(([customer, list]) => ({
    customer,
    invoices: list.length,
    billed: sumAmounts(list.map((i) => totals(i).total)),
    outstanding: sumAmounts(list.filter((i) => !i.paid).map((i) => totals(i).total)),
  }));
  customers.sort((a, b) => b.outstanding - a.outstanding || a.customer.localeCompare(b.customer));
  const billed = sumAmounts(invoices.map((i) => totals(i).total));
  const paid = sumAmounts(invoices.filter((i) => i.paid).map((i) => totals(i).total));
  return { invoices: invoices.length, billed, paid, outstanding: sumAmounts([billed, -paid]), customers };
}
