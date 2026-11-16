import { describe, expect, it } from 'vitest';
import { aging } from '../src/report/aging.js';
import type { Invoice } from '../src/types.js';

function invoice(id: string, dueOn: string, amount: number): Invoice {
  return {
    id,
    customer: { id: 'k', name: 'Kestrel' },
    issuedOn: '2026-01-01',
    dueOn,
    items: [{ description: 'work', quantity: 1, unitPrice: amount }],
    taxRate: 0,
    paid: false,
  };
}

describe('aging', () => {
  it('FB-87: an invoice 30 days overdue is still in 1-30 days, and one due today is not overdue', () => {
    const report = aging([invoice('A', '2026-10-01', 100), invoice('B', '2026-10-31', 50)], '2026-10-31');
    expect(report.buckets[0]).toMatchObject({ label: '1-30 days', amount: 100 });
    expect(report.total).toBe(100);
  });
});
