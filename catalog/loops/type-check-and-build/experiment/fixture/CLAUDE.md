# invoicer

A command-line tool that reports on a JSON file of invoices. TypeScript on Node 22, ES modules.

- `src/`: the code. `cli.ts` is the entry point; `report/` holds the summary and aging reports, `export/` the CSV.
- `tests/`: Vitest tests.

Commands: `npm test` (tests), `npm run build` (bundle to `dist/` with tsup), `npm run dev -- <command> <file>` (run from source).
