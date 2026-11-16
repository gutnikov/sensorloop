import { isOverdue, totals } from '../invoice.js';
import { sumAmounts } from '../money.js';
import { CURRENCIES, type Currency, type Invoice } from '../types.js';

export interface AgingBucket {
  label: string;
  invoices: Invoice[];
  amount: number;
}

/** The overdue invoices in one currency. */
export interface AgingReport {
  today: string;
  currency: Currency;
  buckets: AgingBucket[];
  total: number;
}

const DAY = 24 * 60 * 60 * 1000;
const BUCKETS = [
  { label: '1-30 days', upTo: 30 },
  { label: '31-60 days', upTo: 60 },
  { label: '61-90 days', upTo: 90 },
  { label: 'over 90 days', upTo: Infinity },
];

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY);
}

function agingOne(currency: Currency, invoices: Invoice[], today: string): AgingReport {
  const buckets: AgingBucket[] = BUCKETS.map(({ label }) => ({ label, invoices: [], amount: 0 }));
  for (const invoice of invoices.filter((i) => isOverdue(i, today))) {
    const days = daysBetween(invoice.dueOn, today);
    buckets[BUCKETS.findIndex((b) => days <= b.upTo)].invoices.push(invoice);
  }
  for (const bucket of buckets) bucket.amount = sumAmounts(bucket.invoices.map((i) => totals(i).total));
  return { today, currency, buckets, total: sumAmounts(buckets.map((b) => b.amount)) };
}

/** Unpaid invoices past their due date, grouped by how long they are overdue: one report per currency. */
export function aging(invoices: Invoice[], today: string): AgingReport[] {
  return CURRENCIES.map((currency) => invoices.filter((i) => i.currency === currency))
    .filter((list) => list.length > 0)
    .map((list) => agingOne(list[0].currency, list, today));
}
