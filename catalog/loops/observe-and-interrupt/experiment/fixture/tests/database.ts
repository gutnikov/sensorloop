// A fresh database for a test: PGlite, Postgres in memory, with the migrations applied in order as dbmate applies
// them: the `-- migrate:up` part of each file in db/migrations, each version recorded in schema_migrations.
import { readdirSync, readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const migrations = new URL('../db/migrations/', import.meta.url);

export async function freshDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec('CREATE TABLE schema_migrations (version varchar(128) PRIMARY KEY)');
  for (const file of readdirSync(migrations).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(new URL(file, migrations), 'utf8');
    await db.exec(sql.split(/^-- migrate:down/m)[0]);
    await db.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file.split('_')[0]]);
  }
  return db;
}
