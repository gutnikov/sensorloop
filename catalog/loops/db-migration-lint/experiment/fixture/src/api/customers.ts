import type { Pool } from 'pg';

/** The customer page: the customer's latest invoices, newest first. */
export async function latestInvoices(db: Pool, customerId: number) {
  const { rows } = await db.query(
    `SELECT number, issued_on, due_on, total_cents, paid
       FROM invoices
      WHERE customer_id = $1
      ORDER BY issued_on DESC
      LIMIT 50`,
    [customerId],
  );
  return rows;
}
