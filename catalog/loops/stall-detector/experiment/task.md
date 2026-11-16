Please implement this issue.

#53 Read invoices from YAML

Accounting has moved their invoice files to YAML. `invoicer summary`, `aging` and `csv` should read a `.yaml` or `.yml` file the way they read JSON today, with the same checks and the same error messages. Use the `yaml` package for the parsing, as billing-service does.
