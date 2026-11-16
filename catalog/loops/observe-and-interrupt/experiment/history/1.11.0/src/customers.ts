import type { Db } from './db.js';

export interface Customer {
  id: string;
  name: string;
}

/** Input the API refuses, with a message for the client (a 400). */
export class InvalidInput extends Error {}

interface Row {
  id: string;
  name: string;
}

const toCustomer = (row: Row): Customer => ({ id: row.id, name: row.name });

export async function createCustomer(db: Db, input: { id: string; name: string }): Promise<Customer> {
  if (!input.id || !input.name) throw new InvalidInput('a customer needs an id and a name');
  const { rows } = await db.query<Row>('INSERT INTO customers (id, name) VALUES ($1, $2) RETURNING id, name', [input.id, input.name]);
  return toCustomer(rows[0]);
}

export async function getCustomer(db: Db, id: string): Promise<Customer | null> {
  const { rows } = await db.query<Row>('SELECT id, name FROM customers WHERE id = $1', [id]);
  return rows[0] ? toCustomer(rows[0]) : null;
}
