# invoicer-cloud

The hosted invoicer: an HTTP API over a Postgres database, for customers and their invoices.

```
DATABASE_URL=postgres://localhost/invoicer npm run dev    # the API on :3000
```

## Database

Migrations are SQL files in `db/migrations/`, run by [dbmate](https://github.com/amacneil/dbmate):
`npm run migrate:new <name>` creates one, `npm run migrate` applies the pending ones to `DATABASE_URL`. Each file has
a `-- migrate:up` part and a `-- migrate:down` part.

## Development

- `npm test` runs the tests (Vitest). They run on PGlite, Postgres in memory, with the migrations applied in order as
  dbmate applies them (`tests/database.ts`): there is no database to set up.
- `npm run typecheck` checks the types (`tsc`).

CI runs `npm run typecheck` and `npm test` on every pull request.

## Deploys

Every push to `main` deploys (`.github/workflows/deploy.yml`): `npm run migrate` against the production database,
then the new version rolls out. Releases are tagged, and listed in `CHANGELOG.md`.
