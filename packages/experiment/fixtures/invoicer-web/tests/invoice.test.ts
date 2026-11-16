import { describe, expect, it } from 'vitest';
import { customerSummaries } from '../src/customers.js';
import { status, totals } from '../src/invoice.js';
import type { Invoice } from '../src/types.js';

function invoice(id: string, customer: string, amount: number, paid: boolean, dueOn = '2026-01-31'): Invoice {
  return {
    id,
    customer: { id: customer.toLowerCase(), name: customer },
    issuedOn: '2026-01-01',
    dueOn,
    items: [{ description: 'work', quantity: 1, unitPrice: amount }],
    taxRate: 0.2,
    paid,
  };
}

describe('totals', () => {
  it('adds tax to the subtotal, in cents', () => {
    expect(totals(invoice('1', 'Alder', 99.99, false))).toEqual({ subtotal: 99.99, tax: 20, total: 119.99 });
  });
});

describe('status', () => {
  it('is Overdue after the due date, Unpaid until then, Paid once paid', () => {
    expect(status(invoice('1', 'Alder', 10, false), '2026-02-01')).toBe('Overdue');
    expect(status(invoice('1', 'Alder', 10, false), '2026-01-31')).toBe('Unpaid');
    expect(status(invoice('1', 'Alder', 10, true), '2026-02-01')).toBe('Paid');
  });
});

describe('customerSummaries', () => {
  it('sums each customer, by name', () => {
    const lines = customerSummaries([invoice('1', 'Birch', 100, true), invoice('2', 'Alder', 50, false), invoice('3', 'Birch', 10, false)]);
    expect(lines.map((c) => [c.name, c.invoices, c.billed, c.outstanding])).toEqual([
      ['Alder', 1, 60, 60],
      ['Birch', 2, 132, 12],
    ]);
  });
});
