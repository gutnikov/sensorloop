import type { Status } from '../invoice.js';
import { html, type Html } from './html.js';

export interface PageOptions {
  /** Scripts this page needs, from public/; each page loads only its own. */
  scripts?: string[];
}

/** A whole page: the header and navigation around the page's own content. */
export function page(title: string, body: Html, { scripts = [] }: PageOptions = {}): string {
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Invoicer</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
${scripts.map((src) => html`<script src="${src}" defer></script>`)}
</head>
<body>
<header class="top">
  <a class="brand" href="/invoices">Invoicer</a>
  <nav aria-label="Main"><a href="/invoices">Invoices</a> <a href="/customers">Customers</a></nav>
</header>
<main>
${body}
</main>
</body>
</html>
`.text;
}

export function statusBadge(status: Status): Html {
  return html`<span class="status status-${status.toLowerCase()}">${status}</span>`;
}

export function notFoundPage(what: string): string {
  return page('Not found', html`<h1>Not found</h1>
<p>${what}</p>
<p><a href="/invoices">All invoices</a></p>`);
}
