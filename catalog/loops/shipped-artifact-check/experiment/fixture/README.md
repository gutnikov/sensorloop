# invoicer

Reports on a file of invoices: what was billed, what was paid and what is still owed, which invoices are overdue,
and a CSV export for spreadsheets.

```
npm run dev -- summary data/invoices.json
npm run dev -- aging data/invoices.json --today 2026-11-01
npm run dev -- csv data/invoices.json > invoices.csv
```

The invoices file is a JSON list; `data/invoices.json` is an example.

## Installing

The accountant runs it from a package, not from this repository:

```
npm pack                                   # builds, then writes invoicer-<version>.tgz
npm install -g ./invoicer-<version>.tgz    # on the accountant's machine
```

See ARCHITECTURE.md for how the code is laid out.

## Development

- `npm test` runs the tests (Vitest).
- `npm run typecheck` checks the types (`tsc --noEmit`).
- `npm run build` compiles to `dist/`; `dist/cli.js` is the `invoicer` command.

CI runs `npm run typecheck`, `npm test` and `npm run build` on every pull request.
