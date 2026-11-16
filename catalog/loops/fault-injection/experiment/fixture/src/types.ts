/** The currencies an invoice can be in. */
export const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
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
}

export interface Invoice {
  id: string;
  customer: Customer;
  /** Every amount on the invoice is in this currency. */
  currency: Currency;
  /** YYYY-MM-DD */
  issuedOn: string;
  /** YYYY-MM-DD */
  dueOn: string;
  items: LineItem[];
  /** A fraction: 0.2 is 20 %. */
  taxRate: number;
  discountCode?: string;
  paid: boolean;
}
