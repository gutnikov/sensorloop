import { totals } from '../invoice.js';
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
      t.subtotal.toFixed(2),
      t.discount.toFixed(2),
      t.tax.toFixed(2),
      t.total.toFixed(2),
      invoice.paid ? 'yes' : 'no',
    ];
  });
  return [COLUMNS, ...rows].map((row) => row.map(cell).join(',')).join('\n') + '\n';
}
