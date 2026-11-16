import { status, totals } from '../invoice.js';
import { formatMoney, roundCents } from '../money.js';
import type { Invoice } from '../types.js';
import { html } from './html.js';
import { page, statusBadge } from './layout.js';

const percent = (rate: number) => `${roundCents(rate * 100)} %`;

/** One invoice: who it is for, its dates and status, its items and its total. */
export function invoicePage(invoice: Invoice, today: string): string {
  const sums = totals(invoice);
  const items = invoice.items.map(
    (item) => html`<tr>
  <td>${item.description}</td>
  <td class="num">${item.quantity}</td>
  <td class="num">${formatMoney(item.unitPrice)}</td>
  <td class="num">${formatMoney(roundCents(item.quantity * item.unitPrice))}</td>
</tr>`,
  );
  const body = html`<h1>Invoice ${invoice.id}</h1>
<dl class="facts">
  <dt>Customer</dt><dd>${invoice.customer.name}</dd>
  <dt>Issued</dt><dd>${invoice.issuedOn}</dd>
  <dt>Due</dt><dd>${invoice.dueOn}</dd>
  <dt>Status</dt><dd>${statusBadge(status(invoice, today))}</dd>
</dl>
<table class="items">
<thead><tr><th scope="col">Item</th><th scope="col" class="num">Quantity</th><th scope="col" class="num">Price</th><th scope="col" class="num">Amount</th></tr></thead>
<tbody>
${items}
</tbody>
<tfoot>
<tr><th scope="row" colspan="3">Subtotal</th><td class="num">${formatMoney(sums.subtotal)}</td></tr>
<tr><th scope="row" colspan="3">Tax (${percent(invoice.taxRate)})</th><td class="num">${formatMoney(sums.tax)}</td></tr>
<tr class="total"><th scope="row" colspan="3">Total</th><td class="num">${formatMoney(sums.total)}</td></tr>
</tfoot>
</table>
<p><a href="/invoices">All invoices</a></p>`;
  return page(`Invoice ${invoice.id}`, body);
}
