#!/usr/bin/env node
import Anthropic from '@anthropic-ai/sdk';
import { CategorizeError, categorizeInvoices } from './categorize/categorize.js';
import { renderCategories } from './categorize/render.js';
import { toCsv } from './export/csv.js';
import { InvoiceFileError, readInvoices } from './parse.js';
import { aging } from './report/aging.js';
import { renderAging, renderSummary } from './report/render.js';
import { summarize } from './report/summary.js';

const USAGE = `Usage:
  invoicer summary <file>                     billed, paid and outstanding, overall and per customer
  invoicer aging <file> [--today YYYY-MM-DD]  overdue invoices, by how long they are overdue
  invoicer csv <file>                         one row per invoice, for spreadsheets
  invoicer categorize <file>                  the accounting category of every line item (asks the model)`;

async function main(args: string[]): Promise<number> {
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
    case 'categorize':
      process.stdout.write(renderCategories(await categorizeInvoices(invoices)));
      return 0;
    default:
      console.error(`unknown command: ${command}\n${USAGE}`);
      return 2;
  }
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    if (error instanceof InvoiceFileError || error instanceof CategorizeError) {
      console.error(`invoicer: ${error.message}`);
    } else if (error instanceof Anthropic.AnthropicError) {
      console.error(`invoicer: the model's API failed: ${error.message}`);
    } else {
      throw error;
    }
    process.exitCode = 1;
  },
);
