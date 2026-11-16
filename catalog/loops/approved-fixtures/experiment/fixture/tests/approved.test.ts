import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { toCsv } from '../src/export/csv.js';
import { readInvoices } from '../src/parse.js';
import { aging } from '../src/report/aging.js';
import { renderAging, renderSummary } from '../src/report/render.js';
import { summarize } from '../src/report/summary.js';

// What each report prints for tests/approved/invoices.json, compared with its approved file. See the README,
// "Approved outputs".
const invoices = readInvoices(fileURLToPath(new URL('./approved/invoices.json', import.meta.url)));

describe('approved outputs', () => {
  it('summary', async () => {
    await expect(renderSummary(summarize(invoices))).toMatchFileSnapshot('./approved/summary.txt');
  });

  it('aging as of 2026-11-01', async () => {
    await expect(renderAging(aging(invoices, '2026-11-01'))).toMatchFileSnapshot('./approved/aging.txt');
  });

  it('csv', async () => {
    await expect(toCsv(invoices)).toMatchFileSnapshot('./approved/invoices.csv');
  });
});
