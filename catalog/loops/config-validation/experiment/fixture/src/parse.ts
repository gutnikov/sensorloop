import { readFileSync } from 'node:fs';
import type { Config, Country } from './config.js';
import type { Customer, Invoice, LineItem } from './types.js';

/** A problem with the invoices file, reported to the user as it is. */
export class InvoiceFileError extends Error {}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function fail(where: string, message: string): never {
  throw new InvoiceFileError(`${where}: ${message}`);
}

function text(value: unknown, where: string): string {
  if (typeof value !== 'string' || value === '') fail(where, 'expected a non-empty string');
  return value;
}

function amount(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail(where, 'expected a number of 0 or more');
  return value;
}

function date(value: unknown, where: string): string {
  const s = text(value, where);
  if (!DATE.test(s)) fail(where, 'expected a date as YYYY-MM-DD');
  return s;
}

function lineItem(raw: any, where: string): LineItem {
  return {
    description: text(raw?.description, `${where}.description`),
    quantity: amount(raw?.quantity, `${where}.quantity`),
    unitPrice: amount(raw?.unitPrice, `${where}.unitPrice`),
  };
}

function customer(raw: any, where: string, config: Config): [Customer, Country] {
  const code = text(raw?.country, `${where}.country`);
  const country = config.countries[code];
  if (!country) fail(`${where}.country`, `${code} is not in the configuration`);
  return [{ id: text(raw?.id, `${where}.id`), name: text(raw?.name, `${where}.name`), country: code }, country];
}

/** The invoice's own tax rate, or its customer's country's VAT rate when it sets none. */
function taxRate(value: unknown, country: Country, where: string): number {
  if (value === undefined) return country.vatRate;
  const rate = amount(value, where);
  if (rate >= 1) fail(where, 'expected a fraction below 1');
  return rate;
}

export function parseInvoice(raw: any, where: string, config: Config): Invoice {
  const id = text(raw?.id, `${where}.id`);
  where = `invoice ${id}`;
  if (!Array.isArray(raw.items) || raw.items.length === 0) fail(`${where}.items`, 'expected at least one item');
  const [buyer, country] = customer(raw.customer, `${where}.customer`, config);
  return {
    id,
    customer: buyer,
    currency: country.currency,
    issuedOn: date(raw.issuedOn, `${where}.issuedOn`),
    dueOn: date(raw.dueOn, `${where}.dueOn`),
    items: raw.items.map((item: unknown, i: number) => lineItem(item, `${where}.items[${i}]`)),
    taxRate: taxRate(raw.taxRate, country, `${where}.taxRate`),
    discountCode: raw.discountCode === undefined ? undefined : text(raw.discountCode, `${where}.discountCode`),
    paid: raw.paid === true,
  };
}

export function parseInvoices(json: string, config: Config): Invoice[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (error) {
    throw new InvoiceFileError(`not JSON: ${(error as Error).message}`);
  }
  if (!Array.isArray(data)) throw new InvoiceFileError('expected a list of invoices');
  return data.map((raw, i) => parseInvoice(raw, `invoice #${i + 1}`, config));
}

export function readInvoices(path: string, config: Config): Invoice[] {
  return parseInvoices(readFileSync(path, 'utf8'), config);
}
