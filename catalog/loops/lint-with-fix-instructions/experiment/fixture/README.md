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
- `npm run lint` runs ESLint (`eslint.config.js`).
- `npm run typecheck` checks the types (`tsc --noEmit`).
- `npm run build` compiles to `dist/`; `dist/cli.js` is the `invoicer` command.

CI runs `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` on every pull request.
