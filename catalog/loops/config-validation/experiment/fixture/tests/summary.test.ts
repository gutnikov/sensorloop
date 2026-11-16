import { describe, expect, it } from 'vitest';
import { summarize } from '../src/report/summary.js';
import type { Invoice } from '../src/types.js';

function invoice(id: string, customer: string, amount: number, paid: boolean): Invoice {
  return {
    id,
    customer: { id: customer.toLowerCase(), name: customer, country: 'US' },
    currency: 'USD',
    issuedOn: '2026-01-01',
    dueOn: '2026-01-31',
    items: [{ description: 'work', quantity: 1, unitPrice: amount }],
    taxRate: 0,
    paid,
  };
}

describe('summarize', () => {
  const [summary] = summarize([
    invoice('1', 'Alder', 100, true),
    invoice('2', 'Alder', 250, false),
    invoice('3', 'Birch', 400, false),
    invoice('4', 'Cedar', 80, true),
  ]);

  it('adds up what was billed, paid and owed', () => {
    expect(summary).toMatchObject({ invoices: 4, billed: 830, paid: 180, outstanding: 650 });
  });

  it('lists customers by what they owe, largest first', () => {
    expect(summary.customers.map((c) => [c.customer, c.outstanding])).toEqual([
      ['Birch', 400],
      ['Alder', 250],
      ['Cedar', 0],
    ]);
  });
});
