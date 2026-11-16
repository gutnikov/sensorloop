import { InvoiceFileError } from './parse.js';
import type { Invoice } from './types.js';

/** The invoices of one customer, by the customer's id. An id that no invoice has is an error that names it. */
export function forCustomer(invoices: Invoice[], id: string): Invoice[] {
  const theirs = invoices.filter((invoice) => invoice.customer.id === id);
  if (theirs.length === 0) throw new InvoiceFileError(`no invoices for customer ${id}`);
  return theirs;
}
