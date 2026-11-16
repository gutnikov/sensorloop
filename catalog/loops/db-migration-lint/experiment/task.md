Please fix this issue.

#61 The customer page takes 9 seconds

Customers with many invoices wait 9 seconds for their page. It runs the query in `src/api/customers.ts`, and `EXPLAIN` shows a sequential scan over `invoices`.
