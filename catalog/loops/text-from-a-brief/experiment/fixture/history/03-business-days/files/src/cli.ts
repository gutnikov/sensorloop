#!/usr/bin/env node
import { toCsv } from './export/csv.js';
import { forCustomer } from './filter.js';
import { InvoiceFileError, readInvoices } from './parse.js';
import { aging } from './report/aging.js';
import { renderAging, renderSummary } from './report/render.js';
import { summarize } from './report/summary.js';

const USAGE = `Usage:
  invoicer summary <file> [--customer <id>]                     billed, paid and outstanding
  invoicer aging <file> [--today YYYY-MM-DD] [--customer <id>]  overdue invoices, by how long
          [--business-days]                                     counting only weekdays
  invoicer csv <file>                                           one row per invoice, for spreadsheets`;

function option(args: string[], name: string): string | undefined {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
}

function main(args: string[]): number {
  const [command, file, ...rest] = args;
  if (!command || !file) {
    console.error(USAGE);
    return 2;
  }
  const all = readInvoices(file);
  const customer = option(rest, '--customer');
  const invoices = customer === undefined ? all : forCustomer(all, customer);
  switch (command) {
    case 'summary':
      process.stdout.write(renderSummary(summarize(invoices)));
      return 0;
    case 'aging': {
      const today = option(rest, '--today') ?? new Date().toISOString().slice(0, 10);
      process.stdout.write(renderAging(aging(invoices, today, { businessDays: rest.includes('--business-days') })));
      return 0;
    }
    case 'csv':
      process.stdout.write(toCsv(all));
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
