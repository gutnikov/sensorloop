import { describe, expect, it } from 'vitest';
import { isOverdue, totals } from '../src/invoice.js';
import type { Invoice } from '../src/types.js';

const invoice: Invoice = {
  id: 'INV-1',
  customer: { id: 'c', name: 'C' },
  currency: 'USD',
  issuedOn: '2026-01-01',
  dueOn: '2026-01-31',
  items: [
    { description: 'a', quantity: 3, unitPrice: 19.99 },
    { description: 'b', quantity: 1, unitPrice: 40 },
  ],
  taxRate: 0.2,
  discountCode: 'WELCOME10',
  paid: false,
};

describe('totals', () => {
  it('takes the discount off before tax', () => {
    expect(totals(invoice)).toEqual({ subtotal: 99.97, discount: 10, tax: 17.99, total: 107.96 });
  });

  it('has no discount without a code', () => {
    expect(totals({ ...invoice, discountCode: undefined }).total).toBe(119.96);
  });
});

describe('isOverdue', () => {
  it('is overdue after the due date when unpaid', () => {
    expect(isOverdue(invoice, '2026-02-01')).toBe(true);
    expect(isOverdue(invoice, '2026-01-31')).toBe(false);
  });

  it('is never overdue once paid', () => {
    expect(isOverdue({ ...invoice, paid: true }, '2027-01-01')).toBe(false);
  });
});
