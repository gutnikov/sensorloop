import { formatMoney } from '../money.js';
import type { AgingReport } from './aging.js';
import type { Summary } from './summary.js';

/** Rows as aligned columns: the first left-aligned, the rest right-aligned. */
function table(rows: string[][]): string {
  const widths = rows[0].map((_, col) => Math.max(...rows.map((row) => row[col].length)));
  return rows
    .map((row) => row.map((cell, col) => (col === 0 ? cell.padEnd(widths[col]) : cell.padStart(widths[col]))).join('  '))
    .join('\n');
}

export function renderSummary(summary: Summary): string {
  const head = [
    `Invoices     ${summary.invoices}`,
    `Billed       ${formatMoney(summary.billed)}`,
    `Paid         ${formatMoney(summary.paid)}`,
    `Outstanding  ${formatMoney(summary.outstanding)}`,
  ];
  const rows = [
    ['Customer', 'Invoices', 'Billed', 'Outstanding'],
    ...summary.customers.map((c) => [c.customer, String(c.invoices), formatMoney(c.billed), formatMoney(c.outstanding)]),
  ];
  return `${head.join('\n')}\n\n${table(rows)}\n`;
}

export function renderAging(report: AgingReport): string {
  const count = report.buckets.reduce((n, b) => n + b.invoices.length, 0);
  const rows = [
    ['Overdue', 'Invoices', 'Amount'],
    ...report.buckets.map((b) => [b.label, String(b.invoices.length), formatMoney(b.amount)]),
    ['Total', String(count), formatMoney(report.total)],
  ];
  return `As of ${report.today}\n\n${table(rows)}\n`;
}
