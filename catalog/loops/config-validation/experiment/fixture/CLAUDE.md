# invoicer

A command-line tool that reports on a JSON file of invoices. TypeScript on Node 22, ES modules.

- `src/`: the code. `cli.ts` is the entry point; `report/` holds the summary and aging reports, `export/` the CSV.
- `tests/`: Vitest tests.
- `invoicer.config.json`: the countries we invoice, with their currency and VAT rate. Its schema is
  `invoicer.config.schema.json`.

Commands: `npm test` (tests), `npm run typecheck` (types), `npm run build` (compile to `dist/`).
