#!/usr/bin/env node
import { toCsv } from './export/csv.js';
import { InvoiceFileError, readInvoices } from './parse.js';
import { aging } from './report/aging.js';
import { renderAging, renderSummary } from './report/render.js';
import { summarize } from './report/summary.js';

const USAGE = `Usage:
  invoicer summary <file>                     billed, paid and outstanding, overall and per customer
  invoicer aging <file> [--today YYYY-MM-DD]  overdue invoices, by how long they are overdue
  invoicer csv <file>                         one row per invoice, for spreadsheets`;

function main(args: string[]): number {
  const [command, file, ...rest] = args;
  if (!command || !file) {
    console.error(USAGE);
    return 2;
  }
  const invoices = readInvoices(file);
  switch (command) {
    case 'summary':
      process.stdout.write(renderSummary(summarize(invoices)));
      return 0;
    case 'aging': {
      const at = rest.indexOf('--today');
      const today = at >= 0 ? rest[at + 1] : new Date().toISOString().slice(0, 10);
      process.stdout.write(renderAging(aging(invoices, today)));
      return 0;
    }
    case 'csv':
      process.stdout.write(toCsv(invoices));
      return 0;
    default:
      console.error(`unknown command: ${command}\n${USAGE}`);
      return 2;
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  if (!(error instanceof InvoiceFileError)) throw error;
  console.error(`invoicer: ${error.message}`);
  process.exitCode = 1;
}
