import type { Db } from './db.js';

export interface Customer {
  id: string;
  name: string;
  /** Where the customer wants its invoices sent; null until it gives one. */
  billingEmail: string | null;
}

/** Input the API refuses, with a message for the client (a 400). */
export class InvalidInput extends Error {}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface Row {
  id: string;
  name: string;
  billing_email: string | null;
}

const toCustomer = (row: Row): Customer => ({ id: row.id, name: row.name, billingEmail: row.billing_email });

function checkEmail(email: string | null): string | null {
  if (email !== null && !EMAIL.test(email)) throw new InvalidInput(`not an email address: ${email}`);
  return email;
}

export async function createCustomer(db: Db, input: { id: string; name: string; billingEmail?: string | null }): Promise<Customer> {
  if (!input.id || !input.name) throw new InvalidInput('a customer needs an id and a name');
  const { rows } = await db.query<Row>(
    'INSERT INTO customers (id, name, billing_email) VALUES ($1, $2, $3) RETURNING id, name, billing_email',
    [input.id, input.name, checkEmail(input.billingEmail ?? null)],
  );
  return toCustomer(rows[0]);
}

/** Sets or clears (null) the customer's billing email; null when there is no such customer. */
export async function setBillingEmail(db: Db, id: string, email: string | null): Promise<Customer | null> {
  const { rows } = await db.query<Row>(
    'UPDATE customers SET billing_email = $2 WHERE id = $1 RETURNING id, name, billing_email',
    [id, checkEmail(email)],
  );
  return rows[0] ? toCustomer(rows[0]) : null;
}

export async function getCustomer(db: Db, id: string): Promise<Customer | null> {
  const { rows } = await db.query<Row>('SELECT id, name, billing_email FROM customers WHERE id = $1', [id]);
  return rows[0] ? toCustomer(rows[0]) : null;
}
