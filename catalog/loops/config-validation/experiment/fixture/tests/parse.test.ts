import { describe, expect, it } from 'vitest';
import type { Config } from '../src/config.js';
import { parseInvoices } from '../src/parse.js';

const config: Config = {
  countries: {
    US: { currency: 'USD', vatRate: 0 },
    GB: { currency: 'GBP', vatRate: 0.2 },
  },
};

const valid = {
  id: 'INV-7',
  customer: { id: 'k', name: 'Kestrel', country: 'GB' },
  issuedOn: '2026-03-01',
  dueOn: '2026-03-31',
  items: [{ description: 'Audit', quantity: 1, unitPrice: 500 }],
};

const parse = (invoices: unknown[]) => parseInvoices(JSON.stringify(invoices), config);

describe('parseInvoices', () => {
  it('reads a list of invoices', () => {
    const [invoice] = parse([valid]);
    expect(invoice.id).toBe('INV-7');
    expect(invoice.paid).toBe(false);
    expect(invoice.discountCode).toBeUndefined();
  });

  it("takes the currency and the VAT rate of the customer's country", () => {
    const [invoice] = parse([valid]);
    expect(invoice.currency).toBe('GBP');
    expect(invoice.taxRate).toBe(0.2);
  });

  it('keeps a tax rate the invoice sets', () => {
    const [invoice] = parse([{ ...valid, taxRate: 0.05 }]);
    expect(invoice.taxRate).toBe(0.05);
  });

  it('names the invoice and the field that is wrong', () => {
    expect(() => parse([{ ...valid, dueOn: '31/03/2026' }])).toThrow('invoice INV-7.dueOn: expected a date as YYYY-MM-DD');
    expect(() => parse([{ ...valid, items: [] }])).toThrow('invoice INV-7.items');
    expect(() => parse([{ ...valid, customer: { ...valid.customer, country: 'FR' } }])).toThrow(
      'invoice INV-7.customer.country: FR is not in the configuration',
    );
  });

  it('refuses a file that is not a list', () => {
    expect(() => parseInvoices('{}', config)).toThrow('expected a list of invoices');
    expect(() => parseInvoices('[', config)).toThrow('not JSON');
  });
});
