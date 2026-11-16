# invoicer

A command-line tool that reports on a JSON file of invoices. TypeScript on Node 22, ES modules.

- `src/`: the code. `cli.ts` is the entry point; `report/` holds the summary and aging reports, `export/` the CSV.
- `tests/`: Vitest tests.

How we work, and how tests come from an issue's acceptance criteria: CONTRIBUTING.md.

Commands: `npm test` (tests), `npm run typecheck` (types), `npm run build` (compile to `dist/`).
