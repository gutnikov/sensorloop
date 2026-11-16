// How billing-service uses invoicer today. It must keep compiling, and give the same results, after the change.
import { aging, formatMoney, parseInvoices, summarize, toCsv, totals, type Invoice, type Summary } from 'invoicer';

const invoice: Invoice = {
  id: 'B-1',
  customer: { id: 'x', name: 'Xylo' },
  issuedOn: '2026-01-01',
  dueOn: '2026-01-31',
  items: [{ description: 'Plan', quantity: 2, unitPrice: 50 }],
  taxRate: 0.2,
  paid: false,
};
const summary: Summary = summarize([invoice]);
const billed: number = summary.billed;
const outstanding: number = summary.customers[0].outstanding;
const label: string = formatMoney(totals(invoice).total);
const overdue: number = aging([invoice], '2026-03-01').total;
const csv: string = toCsv([invoice]);
const parsed: Invoice[] = parseInvoices(JSON.stringify([invoice]));

console.log(JSON.stringify({ billed, outstanding, label, overdue, header: csv.split('\n')[0], parsed: parsed.length }));
