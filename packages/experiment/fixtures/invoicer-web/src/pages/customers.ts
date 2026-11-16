import type { CustomerSummary } from '../customers.js';
import { formatMoney } from '../money.js';
import { html } from './html.js';
import { page } from './layout.js';

/** The customers, by name, with what they were billed and what they still owe. */
export function customersPage(customers: CustomerSummary[]): string {
  const rows = customers.map(
    (customer) => html`<tr>
  <td>${customer.name}</td>
  <td class="num">${customer.invoices}</td>
  <td class="num">${formatMoney(customer.billed)}</td>
  <td class="num">${formatMoney(customer.outstanding)}</td>
</tr>`,
  );
  const body = html`<h1>Customers</h1>
<table id="customers">
<thead><tr><th scope="col">Customer</th><th scope="col" class="num">Invoices</th><th scope="col" class="num">Billed</th><th scope="col" class="num">Outstanding</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>`;
  return page('Customers', body);
}
