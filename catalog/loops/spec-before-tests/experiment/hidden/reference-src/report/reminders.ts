import { isOverdue, totals } from '../invoice.js';
import type { Invoice } from '../types.js';

const DAY = 24 * 60 * 60 * 1000;
/** Past this many days overdue, an invoice is with the collection agency. */
const AGENCY_AFTER = 90;
const HEADER = 'invoice,customer,due_on,days_overdue,amount';

function cell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function daysOverdue(invoice: Invoice, today: string): number {
  return Math.round((Date.parse(today) - Date.parse(invoice.dueOn)) / DAY);
}

/**
 * The reminder list as CSV (#58): unpaid invoices past their due date, most overdue first. A customer with an invoice
 * at the collection agency is the agency's: none of their invoices is listed.
 */
export function reminders(invoices: Invoice[], today: string): string {
  const overdue = invoices.filter((i) => isOverdue(i, today)).map((invoice) => ({ invoice, days: daysOverdue(invoice, today) }));
  const atAgency = new Set(overdue.filter((o) => o.days > AGENCY_AFTER).map((o) => o.invoice.customer.id));
  const rows = overdue
    .filter((o) => !atAgency.has(o.invoice.customer.id))
    .sort((a, b) => b.days - a.days || (a.invoice.id < b.invoice.id ? -1 : a.invoice.id > b.invoice.id ? 1 : 0));
  const lines = rows.map(({ invoice, days }) =>
    [invoice.id, invoice.customer.name, invoice.dueOn, String(days), totals(invoice).total.toFixed(2)].map(cell).join(','),
  );
  return [HEADER, ...lines].join('\n') + '\n';
}
