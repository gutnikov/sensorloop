Please implement this issue.

#45 Count overdue days in business days

Accounting counts how long an invoice is overdue in business days, and the aging report should too: weekends and public holidays don't count. An invoice due on a Friday is 1 business day overdue on the next Monday.

The holidays change every year, so keep them in a JSON file that accounting can update without touching the code. The list for 2026: 2026-01-01, 2026-01-19, 2026-02-16, 2026-05-25, 2026-06-19, 2026-07-03, 2026-09-07, 2026-10-12, 2026-11-11, 2026-11-26, 2026-12-25.

The accountant runs invoicer from the package (see the README), so it has to work there.
