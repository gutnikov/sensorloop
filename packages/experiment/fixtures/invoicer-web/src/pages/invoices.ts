import { status, totals } from '../invoice.js';
import { formatMoney } from '../money.js';
import type { Invoice } from '../types.js';
import { html } from './html.js';
import { page, statusBadge } from './layout.js';

/** Every invoice, newest first, with a filter box (public/js/invoice-list.js). */
export function invoiceListPage(invoices: Invoice[], today: string): string {
  const newestFirst = [...invoices].sort((a, b) => b.issuedOn.localeCompare(a.issuedOn) || b.id.localeCompare(a.id));
  const rows = newestFirst.map(
    (invoice) => html`<tr>
  <td><a href="/invoices/${invoice.id}">${invoice.id}</a></td>
  <td>${invoice.customer.name}</td>
  <td>${invoice.issuedOn}</td>
  <td>${invoice.dueOn}</td>
  <td class="num">${formatMoney(totals(invoice).total)}</td>
  <td>${statusBadge(status(invoice, today))}</td>
</tr>`,
  );
  const body = html`<h1>Invoices</h1>
<p class="filter"><label for="filter">Filter</label> <input id="filter" type="search" placeholder="Invoice, customer or status"></p>
<table id="invoices">
<thead><tr><th scope="col">Invoice</th><th scope="col">Customer</th><th scope="col">Issued</th><th scope="col">Due</th><th scope="col" class="num">Total</th><th scope="col">Status</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>`;
  return page('Invoices', body, { scripts: ['/js/invoice-list.js'] });
}
