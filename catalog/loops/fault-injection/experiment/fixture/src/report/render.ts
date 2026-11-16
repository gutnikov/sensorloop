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

function renderOneSummary(summary: Summary): string {
  const money = (amount: number) => formatMoney(amount, summary.currency);
  const head = [
    `Invoices     ${summary.invoices}`,
    `Billed       ${money(summary.billed)}`,
    `Paid         ${money(summary.paid)}`,
    `Outstanding  ${money(summary.outstanding)}`,
  ];
  const rows = [
    ['Customer', 'Invoices', 'Billed', 'Outstanding'],
    ...summary.customers.map((c) => [c.customer, String(c.invoices), money(c.billed), money(c.outstanding)]),
  ];
  return `${head.join('\n')}\n\n${table(rows)}\n`;
}

/** One block per currency; a file in one currency prints as it always did, with no currency heading. */
export function renderSummary(summaries: Summary[]): string {
  if (summaries.length === 1) return renderOneSummary(summaries[0]);
  return summaries.map((s) => `${s.currency}\n\n${renderOneSummary(s)}`).join('\n');
}

function renderOneAging(report: AgingReport): string {
  const money = (amount: number) => formatMoney(amount, report.currency);
  const count = report.buckets.reduce((n, b) => n + b.invoices.length, 0);
  const rows = [
    ['Overdue', 'Invoices', 'Amount'],
    ...report.buckets.map((b) => [b.label, String(b.invoices.length), money(b.amount)]),
    ['Total', String(count), money(report.total)],
  ];
  return `${table(rows)}\n`;
}

export function renderAging(reports: AgingReport[], today: string): string {
  if (reports.length <= 1) return `As of ${today}\n\n${reports.map(renderOneAging).join('')}`;
  return `As of ${today}\n\n${reports.map((r) => `${r.currency}\n${renderOneAging(r)}`).join('\n')}`;
}
