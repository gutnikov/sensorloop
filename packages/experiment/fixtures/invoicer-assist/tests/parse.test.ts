import { describe, expect, it } from 'vitest';
import { parseInvoices } from '../src/parse.js';

const valid = {
  id: 'INV-7',
  customer: { id: 'k', name: 'Kestrel' },
  issuedOn: '2026-03-01',
  dueOn: '2026-03-31',
  items: [{ description: 'Audit', quantity: 1, unitPrice: 500 }],
  taxRate: 0.2,
};

describe('parseInvoices', () => {
  it('reads a list of invoices', () => {
    const [invoice] = parseInvoices(JSON.stringify([valid]));
    expect(invoice.id).toBe('INV-7');
    expect(invoice.paid).toBe(false);
    expect(invoice.discountCode).toBeUndefined();
  });

  it('names the invoice and the field that is wrong', () => {
    expect(() => parseInvoices(JSON.stringify([{ ...valid, dueOn: '31/03/2026' }]))).toThrow(
      'invoice INV-7.dueOn: expected a date as YYYY-MM-DD',
    );
    expect(() => parseInvoices(JSON.stringify([{ ...valid, items: [] }]))).toThrow('invoice INV-7.items');
  });

  it('refuses a file that is not a list', () => {
    expect(() => parseInvoices('{}')).toThrow('expected a list of invoices');
    expect(() => parseInvoices('[')).toThrow('not JSON');
  });
});
