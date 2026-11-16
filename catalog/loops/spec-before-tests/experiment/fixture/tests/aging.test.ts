import { describe, expect, it } from 'vitest';
import { invoice, runCli, writeInvoices } from './helpers/cli.js';

// #45 The aging report as of another day.
describe('invoicer aging', () => {
  const file = writeInvoices([
    invoice({ id: 'A-1', customer: 'Alder', dueOn: '2026-10-01', amount: 100 }),
    invoice({ id: 'A-2', customer: 'Alder', dueOn: '2026-11-01', amount: 40 }),
    invoice({ id: 'B-1', customer: 'Birch', dueOn: '2026-09-01', amount: 250, paid: true }),
  ]);

  it('AC1: --today reports as of that day', () => {
    const r = runCli('aging', file, '--today', '2026-11-01');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('As of 2026-11-01');
    expect(r.stdout).toMatch(/^31-60 days\s+1\s+\$100\.00$/m);
  });

  it('AC2: an invoice due on that day is not overdue yet', () => {
    const r = runCli('aging', file, '--today', '2026-11-01');
    expect(r.stdout).toMatch(/^Total\s+1\s+\$100\.00$/m);
  });

  it('AC3: a paid invoice is never overdue', () => {
    const r = runCli('aging', file, '--today', '2027-01-01');
    expect(r.stdout).toMatch(/^Total\s+2\s+\$140\.00$/m);
  });
});
