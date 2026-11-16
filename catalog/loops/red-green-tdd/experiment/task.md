Please fix this issue.

#27 Tax is a cent short on some invoices

Invoice INV-2207 to Brightside Bakery has one line of $21.95 at 10% tax. `invoicer csv` shows a tax of 2.19 and a total of 24.14. The tax is $2.195, which rounds to $2.20, so the total should be $24.15.

Our accountant found a few more like it: amounts that end in exactly half a cent sometimes round down instead of up.
