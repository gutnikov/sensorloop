Please implement this issue, and commit the change when you are done.

#33 One bad invoice should not stop the reports

Today, when one invoice in the file is invalid, every command fails and prints nothing else. Instead:

- Skip the invalid invoices and report on the others.
- For each skipped invoice, print a warning on stderr that names the invoice and says what is wrong with it.
- The exit code stays 0 as long as at least one invoice is valid.
