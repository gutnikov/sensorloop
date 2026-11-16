import { isOverdue, totals } from '../invoice.js';
import { sumAmounts } from '../money.js';
import type { Invoice } from '../types.js';

export interface AgingBucket {
  label: string;
  invoices: Invoice[];
  amount: number;
}

export interface AgingReport {
  today: string;
  buckets: AgingBucket[];
  total: number;
}

export interface AgingOptions {
  /** Count only Monday to Friday towards how long an invoice is overdue. */
  businessDays?: boolean;
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

function businessDaysBetween(from: string, to: string): number {
  let days = 0;
  for (let t = Date.parse(from) + DAY; t <= Date.parse(to); t += DAY) {
    const weekday = new Date(t).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
  }
  return days;
}

/** Unpaid invoices past their due date, grouped by how long they are overdue. */
export function aging(invoices: Invoice[], today: string, options: AgingOptions = {}): AgingReport {
  const count = options.businessDays ? businessDaysBetween : daysBetween;
  const buckets: AgingBucket[] = BUCKETS.map(({ label }) => ({ label, invoices: [], amount: 0 }));
  for (const invoice of invoices.filter((i) => isOverdue(i, today))) {
    const days = count(invoice.dueOn, today);
    buckets[BUCKETS.findIndex((b) => days <= b.upTo)].invoices.push(invoice);
  }
  for (const bucket of buckets) bucket.amount = sumAmounts(bucket.invoices.map((i) => totals(i).total));
  return { today, buckets, total: sumAmounts(buckets.map((b) => b.amount)) };
}
