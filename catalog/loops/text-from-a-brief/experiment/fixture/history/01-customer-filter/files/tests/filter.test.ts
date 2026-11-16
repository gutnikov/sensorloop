import { describe, expect, it } from 'vitest';
import { forCustomer } from '../src/filter.js';
import type { Invoice } from '../src/types.js';

function invoice(id: string, customer: string): Invoice {
  return {
    id,
    customer: { id: customer, name: customer.toUpperCase() },
    issuedOn: '2026-01-01',
    dueOn: '2026-01-31',
    items: [{ description: 'work', quantity: 1, unitPrice: 100 }],
    taxRate: 0,
    paid: false,
  };
}

describe('forCustomer', () => {
  const invoices = [invoice('1', 'alder'), invoice('2', 'birch'), invoice('3', 'alder')];

  it("keeps only that customer's invoices", () => {
    expect(forCustomer(invoices, 'alder').map((i) => i.id)).toEqual(['1', '3']);
  });

  it('names an id that no invoice has', () => {
    expect(() => forCustomer(invoices, 'cedar')).toThrow('no invoices for customer cedar');
  });
});
