# invoicer-cloud

The hosted invoicer's API: TypeScript on Node 22, ES modules, Postgres.

- `src/`: the code. `server.ts` is the HTTP API; `customers.ts` reads and writes customers.
- `db/migrations/`: the database's migrations (dbmate, SQL).
- `tests/`: Vitest tests, on an in-memory Postgres (PGlite).

Commands: `npm test` (tests), `npm run typecheck` (types).
