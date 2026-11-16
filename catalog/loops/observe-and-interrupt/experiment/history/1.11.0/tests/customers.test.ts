import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createCustomer, getCustomer, InvalidInput } from '../src/customers.js';
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
    expect(await getCustomer(db, 'acme')).toEqual({ id: 'acme', name: 'Acme Tools' });
  });

  it('refuses a customer with no name', async () => {
    await expect(createCustomer(db, { id: 'acme', name: '' })).rejects.toThrow(InvalidInput);
  });

  it('has no customer for an unknown id', async () => {
    expect(await getCustomer(db, 'nobody')).toBeNull();
  });
});
