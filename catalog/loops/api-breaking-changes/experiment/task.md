Please implement this issue.

#14 Invoices in more than one currency

We now bill some customers in euros and pounds, and the reports add everything up as if it were dollars.

- Each invoice in the JSON file gets an optional `currency`: "USD", "EUR" or "GBP". An invoice without one is in USD, so the files we already have keep working.
- An invoice with any other currency is an error that names the invoice, like the other errors in the file.
- An invoice's amounts are in its currency, and are printed with its sign: $1,234.50, €1,234.50, £1,234.50.
- `invoicer summary` never adds up amounts in different currencies. Its totals (billed, paid, outstanding) are shown once per currency, and the customer table has one row per customer and currency.
- `invoicer aging` shows its buckets and its total once per currency.
- `invoicer csv` gets a `currency` column, right after `total`.

For a file with only USD invoices, `summary` and `aging` print exactly what they print today.
