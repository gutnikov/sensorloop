import { describe, expect, it } from 'vitest';
import { toCsv } from '../src/export/csv.js';
import type { Invoice } from '../src/types.js';

const invoice: Invoice = {
  id: 'INV-9',
  customer: { id: 'k', name: 'Kestrel, Ltd' },
  issuedOn: '2026-03-01',
  dueOn: '2026-03-31',
  items: [{ description: 'Audit', quantity: 1, unitPrice: 500 }],
  taxRate: 0.2,
  paid: false,
};

describe('toCsv', () => {
  it('writes a header and one row per invoice, quoting a name with a comma', () => {
    expect(toCsv([invoice]).split('\n')).toEqual([
      'id,customer,issued_on,due_on,subtotal,discount,tax,total,paid',
      'INV-9,"Kestrel, Ltd",2026-03-01,2026-03-31,500.00,0.00,100.00,600.00,no',
      '',
    ]);
  });
});
