import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

// The app on a free port, over the sample data, on a fixed day.
let server: Server;
let base: string;

beforeAll(async () => {
  server = createApp({ invoicesFile: 'data/invoices.json', today: () => '2026-11-15' }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('the pages', () => {
  it('lists the invoices with their status', async () => {
    const res = await fetch(`${base}/invoices`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('<a href="/invoices/INV-1002">INV-1002</a>');
    expect(body).toContain('<span class="status status-overdue">Overdue</span>');
    expect(body).toContain('<script src="/js/invoice-list.js" defer></script>');
  });

  it('shows one invoice with its total', async () => {
    const body = await (await fetch(`${base}/invoices/INV-1001`)).text();
    expect(body).toContain('Invoice INV-1001');
    expect(body).toContain('$3,252.48');
    expect(body).toContain('<span class="status status-paid">Paid</span>');
  });

  it('answers 404 for an invoice that does not exist', async () => {
    const res = await fetch(`${base}/invoices/INV-9999`);
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('There is no invoice INV-9999.');
  });

  it('lists the customers, names escaped', async () => {
    const body = await (await fetch(`${base}/customers`)).text();
    expect(body).toContain('Fennel &amp; Finch Studio');
    expect(body).toContain('$5,646.48');
  });

  it('serves the stylesheet', async () => {
    const res = await fetch(`${base}/style.css`);
    expect(res.status).toBe(200);
  });
});
