import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const tsx = path.join(root, 'node_modules', '.bin', 'tsx');

export interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/** Runs `invoicer <args>` from the source, as `npm run dev` does. */
export function runCli(...args: string[]): CliResult {
  const run = spawnSync(tsx, [path.join(root, 'src', 'cli.ts'), ...args], { cwd: root, encoding: 'utf8' });
  return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

export interface InvoiceFields {
  id: string;
  /** The customer's name; its id is the name in lower case, without spaces. */
  customer: string;
  dueOn: string;
  /** The invoice's total: one item, no tax, no discount. */
  amount: number;
  paid?: boolean;
  issuedOn?: string;
}

/** An invoice as the file holds it, with the fields a test does not care about filled in. */
export function invoice(fields: InvoiceFields): object {
  return {
    id: fields.id,
    customer: { id: fields.customer.toLowerCase().replace(/\s+/g, ''), name: fields.customer },
    issuedOn: fields.issuedOn ?? '2026-01-01',
    dueOn: fields.dueOn,
    items: [{ description: 'work', quantity: 1, unitPrice: fields.amount }],
    taxRate: 0,
    paid: fields.paid ?? false,
  };
}

/** Writes invoices to a file of their own, and returns its path. */
export function writeInvoices(invoices: object[]): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicer-test-'));
  const file = path.join(dir, 'invoices.json');
  fs.writeFileSync(file, JSON.stringify(invoices, null, 2));
  return file;
}
