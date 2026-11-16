import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createCustomer, getCustomer, InvalidInput, setBillingEmail } from '../src/customers.js';
import { freshDatabase } from './database.js';

// One database per file, emptied before each test: starting PGlite takes a second or two.
let db: PGlite;
beforeAll(async () => {
  db = await freshDatabase();
}, 30_000);
beforeEach(async () => {
  await db.exec('DELETE FROM invoices; DELETE FROM customers;');
});

describe('customers', () => {
  it('creates a customer and reads it back', async () => {
    await createCustomer(db, { id: 'acme', name: 'Acme Tools' });
    expect(await getCustomer(db, 'acme')).toEqual({ id: 'acme', name: 'Acme Tools', billingEmail: null });
  });

  it('refuses a customer with no name', async () => {
    await expect(createCustomer(db, { id: 'acme', name: '' })).rejects.toThrow(InvalidInput);
  });

  it('has no customer for an unknown id', async () => {
    expect(await getCustomer(db, 'nobody')).toBeNull();
  });
});

describe('billing email', () => {
  it('is kept when the customer is created', async () => {
    const customer = await createCustomer(db, { id: 'acme', name: 'Acme Tools', billingEmail: 'ap@acme.example' });
    expect(customer.billingEmail).toBe('ap@acme.example');
  });

  it('can be set and cleared later', async () => {
    await createCustomer(db, { id: 'acme', name: 'Acme Tools' });
    expect((await setBillingEmail(db, 'acme', 'invoices@acme.example'))?.billingEmail).toBe('invoices@acme.example');
    expect((await setBillingEmail(db, 'acme', null))?.billingEmail).toBeNull();
  });

  it('refuses something that is not an email address', async () => {
    await createCustomer(db, { id: 'acme', name: 'Acme Tools' });
    await expect(setBillingEmail(db, 'acme', 'accounts payable')).rejects.toThrow(InvalidInput);
  });
});
