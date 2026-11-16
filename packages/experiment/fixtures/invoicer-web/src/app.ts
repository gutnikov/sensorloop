import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { customerSummaries } from './customers.js';
import { customersPage } from './pages/customers.js';
import { invoicePage } from './pages/invoice.js';
import { invoiceListPage } from './pages/invoices.js';
import { notFoundPage } from './pages/layout.js';
import { readInvoices } from './store.js';

// public/ sits beside src/ and dist/, so the same path works from the source and from the build.
const publicDir = fileURLToPath(new URL('../public', import.meta.url));

export interface AppOptions {
  /** The invoices file. */
  invoicesFile: string;
  /** Today, as YYYY-MM-DD: what decides which invoices are overdue. */
  today?: () => string;
}

export function createApp({ invoicesFile, today = () => new Date().toISOString().slice(0, 10) }: AppOptions) {
  const app = express();
  app.use(helmet());
  app.use(express.static(publicDir));

  app.get('/', (_req, res) => res.redirect('/invoices'));
  app.get('/invoices', (_req, res) => {
    res.send(invoiceListPage(readInvoices(invoicesFile), today()));
  });
  app.get('/invoices/:id', (req, res) => {
    const invoice = readInvoices(invoicesFile).find((i) => i.id === req.params.id);
    if (!invoice) {
      res.status(404).send(notFoundPage(`There is no invoice ${req.params.id}.`));
      return;
    }
    res.send(invoicePage(invoice, today()));
  });
  app.get('/customers', (_req, res) => {
    res.send(customersPage(customerSummaries(readInvoices(invoicesFile))));
  });
  app.use((_req, res) => {
    res.status(404).send(notFoundPage('There is no such page.'));
  });
  return app;
}
