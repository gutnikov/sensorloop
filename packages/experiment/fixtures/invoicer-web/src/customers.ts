import { totals } from './invoice.js';
import { sumAmounts } from './money.js';
import type { Invoice } from './types.js';

export interface CustomerSummary {
  id: string;
  name: string;
  invoices: number;
  billed: number;
  outstanding: number;
}

/** One line per customer, by name: how many invoices, what was billed and what is still owed. */
export function customerSummaries(invoices: Invoice[]): CustomerSummary[] {
  const byId = new Map<string, Invoice[]>();
  for (const invoice of invoices) byId.set(invoice.customer.id, [...(byId.get(invoice.customer.id) ?? []), invoice]);
  return [...byId.values()]
    .map((list) => ({
      id: list[0].customer.id,
      name: list[0].customer.name,
      invoices: list.length,
      billed: sumAmounts(list.map((i) => totals(i).total)),
      outstanding: sumAmounts(list.filter((i) => !i.paid).map((i) => totals(i).total)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
