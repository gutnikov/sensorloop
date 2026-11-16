# invoice-tools

Commands for the invoice work finance teams do every week.

| Command | What it does |
|---|---|
| `/invoice-tools:aging-review` | Reads the aging report and drafts the week's follow-ups, oldest first |
| `/invoice-tools:dunning-letter <invoice>` | Drafts a polite reminder for an overdue invoice, in the customer's language |
| `/invoice-tools:vat-check` | Checks the tax rates on the invoices against the customer's country |

## Install

```
claude plugin marketplace add acme-finance/claude-plugins
claude plugin install invoice-tools@acme
```

To give a whole team the plugin, add the marketplace and the plugin to the project's `.claude/settings.json`.

## Changes

- 1.3.0: `/invoice-tools:vat-check`; the aging review groups invoices by customer.
- 1.2.0: `/invoice-tools:dunning-letter` writes in the customer's language.
