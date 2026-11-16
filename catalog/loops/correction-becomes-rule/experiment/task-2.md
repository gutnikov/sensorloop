Please implement this issue.

#26 The summary of one month

At the end of each month accounting closes the books, and wants the summary of the invoices issued in that month. Add `--month <YYYY-MM>` to `invoicer summary`: with it, the summary covers only the invoices issued in that month, such as `--month 2026-10`.

- Without `--month`, the summary prints exactly what it prints today.
- A month not written as YYYY-MM is an error that names it.
