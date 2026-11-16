Please implement this issue.

#21 Filter the reports by customer

When I talk to one customer I only want their invoices. Add `--customer <id>` to `invoicer summary` and `invoicer aging`: with it, the report covers only that customer's invoices. The id is the customer's `id` in the file, such as `acme`.

- Without `--customer`, the reports print exactly what they print today.
- An id that no invoice has is an error that names the id.
