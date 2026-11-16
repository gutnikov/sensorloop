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
  /** YYYY-MM-DD */
  issuedOn: string;
  /** YYYY-MM-DD */
  dueOn: string;
  items: LineItem[];
  /** A fraction: 0.2 is 20 %. */
  taxRate: number;
  paid: boolean;
}
