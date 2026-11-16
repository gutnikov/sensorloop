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
- `npm run typecheck` checks the types (`tsc --noEmit`).
- `npm run build` compiles to `dist/`; `dist/cli.js` is the `invoicer` command.

CI runs `npm run typecheck`, `npm test` and `npm run build` on every pull request.

## Approved outputs

`tests/approved/` holds what each report prints for `tests/approved/invoices.json`: `summary.txt`, `aging.txt` (as
of 2026-11-01) and `invoices.csv`. `tests/approved.test.ts` compares the reports with them, so a change to any output
fails the tests until its file is updated: `npx vitest run -u` writes the outputs as they are now.

A changed approved file is reviewed by a person before merge, like the code: the pull request says which outputs
changed and why.
