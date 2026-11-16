Please implement this issue.

#72 Catch vague invoice lines before they go out

Customers' accounts payable keep sending invoices back because a line doesn't say what it was for ("Services", "Misc work", "Travel"): nine last quarter, each one paid weeks late. Add `invoicer review <file>`: it asks the model whether each line of each invoice says clearly enough what we delivered, prints the lines that don't, with why, and exits with 1 when it finds one. Then run it in CI on the files in `invoices/`, so that a pull request with a vague line can't be merged.

Maria in accounting is the one who sends them back to us. She went through last quarter's invoices and graded lines clear or vague, each with her reason: `evals/line-clarity.jsonl`. The check has to agree with her: catch at least 9 in 10 of the lines she'd call vague, and pass at least 9 in 10 of the ones she'd call clear. We don't want it blocking good invoices.
