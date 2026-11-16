Please implement this issue.

#66 Which invoices are overdue

The aging report tells me how much is overdue, but not which invoices, so I end up searching the JSON file. Add `--details` to `invoicer aging`.

Acceptance criteria:

1. With `--details`, each bucket's row is followed by its invoices, one per line: the invoice's id, the customer's name, the due date, the days overdue and the amount.
2. Within a bucket, the invoice overdue the longest comes first.
3. The amounts are the invoices' totals, printed as the report prints amounts, and they add up to the bucket's amount.
4. Without `--details`, `invoicer aging` prints exactly what it prints today.
