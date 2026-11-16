/** The currencies invoicer can print: each has its sign in src/money.ts. */
export const CURRENCIES = ['USD', 'GBP', 'CAD'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** A line on an invoice: what was sold, how many, and the price of one. */
export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2 code, such as GB: one of the countries in invoicer.config.json. */
  country: string;
}

export interface Invoice {
  id: string;
  customer: Customer;
  /** Every amount on the invoice is in this currency: its customer's country's. */
  currency: Currency;
  /** YYYY-MM-DD */
  issuedOn: string;
  /** YYYY-MM-DD */
  dueOn: string;
  items: LineItem[];
  /** A fraction: 0.2 is 20 %. The invoice's own, or its customer's country's VAT rate. */
  taxRate: number;
  discountCode?: string;
  paid: boolean;
}
