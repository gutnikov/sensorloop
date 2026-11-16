# invoicer

Reports on a file of invoices: what was billed, what was paid and what is still owed, which invoices are overdue,
and a CSV export for spreadsheets.

```
npm run dev -- summary data/invoices.json
npm run dev -- aging data/invoices.json --today 2026-11-01
npm run dev -- csv data/invoices.json > invoices.csv
```

The invoices file is a JSON list; `data/invoices.json` is an example.

## Development

- `npm test` runs the tests (Vitest).
- `npm run build` bundles the CLI to `dist/cli.js` with tsup; that is the `invoicer` command.
- `npm run dev -- <command> <file>` runs it from source.

CI (`.github/workflows/ci.yml`) runs on every pull request.
