import { describe, expect, it } from 'vitest';
import { aging } from '../src/report/aging.js';
import type { Invoice } from '../src/types.js';

const invoice: Invoice = {
  id: 'INV-1',
  customer: { id: 'c', name: 'C' },
  issuedOn: '2026-09-01',
  // A Friday.
  dueOn: '2026-10-02',
  items: [{ description: 'work', quantity: 1, unitPrice: 100 }],
  taxRate: 0,
  paid: false,
};

describe('aging with business days', () => {
  it('does not count the weekend', () => {
    // Friday 2 October to Monday 2 November: 31 calendar days, 21 business days.
    expect(aging([invoice], '2026-11-02').buckets[1].invoices).toHaveLength(1);
    expect(aging([invoice], '2026-11-02', { businessDays: true }).buckets[0].invoices).toHaveLength(1);
  });
});
