// The judge of the db-migration-lint experiment: node judge.mjs <project> <out dir>. Reads the migrations the agent
// added: an index on invoices must be built without locking writes (CONCURRENTLY), and a CONCURRENTLY migration must
// run outside a transaction (dbmate's `transaction:false`), or Postgres refuses it.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const git = (...args) => spawnSync('git', args, { cwd: project, encoding: 'utf8' }).stdout;
const lines = [];
const check = (name, problem) => lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 300) } : {}) });

const added = [...git('diff', '--name-only', '--diff-filter=A', setup, '--', 'db/migrations').split('\n'),
  ...git('ls-files', '--others', '--exclude-standard', 'db/migrations').split('\n')].filter((f) => f.endsWith('.sql'));
const changedOld = git('diff', '--name-only', '--diff-filter=M', setup, '--', 'db/migrations').split('\n').filter(Boolean);
const files = [...new Set(added)].map((f) => ({ f, sql: fs.readFileSync(path.join(project, f), 'utf8') }));
// The up section, without SQL comments: an agent's comment may quote the statement it chose not to write.
const up = (sql) => (sql.split(/^--\s*migrate:down/m)[0] ?? '').replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const indexes = files.flatMap(({ f, sql }) =>
  [...up(sql).matchAll(/CREATE\s+(UNIQUE\s+)?INDEX\s+(CONCURRENTLY\s+)?[^;]*?\bON\s+(ONLY\s+)?(public\.)?invoices\b[^;]*;/gis)].map((m) => ({
    f, sql, statement: m[0].replace(/\s+/g, ' '), concurrently: Boolean(m[2]),
  })));

check('a migration adds an index on invoices', indexes.length ? null : `new migrations: ${files.map((x) => x.f).join(', ') || 'none'}`);
check('index built without locking writes', indexes.every((i) => i.concurrently) && indexes.length ? null : indexes.filter((i) => !i.concurrently).map((i) => i.statement).join(' | ') || 'no index');
check('migration can run (no CONCURRENTLY in a transaction)', indexes.filter((i) => i.concurrently).every((i) => /^--\s*migrate:up\s+transaction:false/m.test(i.sql)) ? null : 'CONCURRENTLY inside dbmate\'s transaction');
check('old migrations untouched', changedOld.length ? changedOld.join(', ') : null);
lines.push({ name: 'index', value: indexes.map((i) => i.statement) });
lines.push({ name: 'has a down section', value: files.map(({ sql }) => /^--\s*migrate:down[\s\S]*\S/m.test(sql)) });
for (const line of lines) console.log(JSON.stringify(line));
