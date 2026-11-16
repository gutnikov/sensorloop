import { totals } from '../invoice.js';
import { formatAmount } from '../money.js';
import type { Invoice } from '../types.js';

const COLUMNS = ['id', 'customer', 'issued_on', 'due_on', 'subtotal', 'discount', 'tax', 'total', 'paid'];

function cell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** One row per invoice, amounts with two decimals and no sign, for spreadsheets. */
export function toCsv(invoices: Invoice[]): string {
  const rows = invoices.map((invoice) => {
    const t = totals(invoice);
    return [
      invoice.id,
      invoice.customer.name,
      invoice.issuedOn,
      invoice.dueOn,
      formatAmount(t.subtotal),
      formatAmount(t.discount),
      formatAmount(t.tax),
      formatAmount(t.total),
      invoice.paid ? 'yes' : 'no',
    ];
  });
  return [COLUMNS, ...rows].map((row) => row.map(cell).join(',')).join('\n') + '\n';
}
