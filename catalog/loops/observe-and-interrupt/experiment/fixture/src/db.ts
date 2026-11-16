/**
 * What the code needs of the database: a query with parameters. In production it is pg's pool (server.ts); in the
 * tests, PGlite, Postgres in memory (tests/database.ts).
 */
export interface Db {
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}
