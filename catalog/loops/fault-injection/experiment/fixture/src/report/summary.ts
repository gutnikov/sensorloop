import { totals } from '../invoice.js';
import { sumAmounts } from '../money.js';
import { CURRENCIES, type Currency, type Invoice } from '../types.js';

export interface CustomerLine {
  customer: string;
  invoices: number;
  billed: number;
  outstanding: number;
}

/** The summary of the invoices in one currency: amounts in different currencies are never added up. */
export interface Summary {
  currency: Currency;
  invoices: number;
  billed: number;
  paid: number;
  outstanding: number;
  /** Largest outstanding balance first. */
  customers: CustomerLine[];
}

function summarizeOne(currency: Currency, invoices: Invoice[]): Summary {
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
  return { currency, invoices: invoices.length, billed, paid, outstanding: sumAmounts([billed, -paid]), customers };
}

/** What was billed, what was paid and what is still owed, overall and per customer: one summary per currency. */
export function summarize(invoices: Invoice[]): Summary[] {
  return CURRENCIES.map((currency) => invoices.filter((i) => i.currency === currency))
    .filter((list) => list.length > 0)
    .map((list) => summarizeOne(list[0].currency, list));
}
