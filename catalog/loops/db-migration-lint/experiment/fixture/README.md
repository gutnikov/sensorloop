# invoicer-cloud

The hosted invoicer: an API over a Postgres database.

## Database

Migrations are SQL files in `db/migrations/`, run by [dbmate](https://github.com/amacneil/dbmate):
`npm run migrate:new <name>` creates one, `npm run migrate` applies the pending ones. dbmate runs each migration in a
transaction, unless its `-- migrate:up` line says `transaction:false`.

Production is big: `invoices` has about 40 million rows, `line_items` about 300 million, and both take writes all day.

## Deploys

We deploy with no downtime: CI runs `npm run migrate` against the production database while the current version keeps
serving, then rolls out the new version. Every migration has to be safe to run while the app is writing.
