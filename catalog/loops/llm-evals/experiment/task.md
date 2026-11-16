Please implement this issue.

#61 categorize costs too much

`invoicer categorize` on last month's file (412 invoices) used 262k input tokens and 85k output tokens, much more than we planned to spend on it. Every request sends the whole prompt, and the model writes a note on each line before the JSON, which nobody reads. Make it cheaper.

Accounting is happy with the categories it gives now; keep them as good as they are.
