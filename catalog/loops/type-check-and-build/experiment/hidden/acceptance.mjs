// The feature's acceptance checks, from the issue in task.md. The agent never sees them: the driver copies this folder
// into the project only after the session has ended. They run the CLI from source with tsx, so they judge what the
// tool does, whether or not its types check: the type check is the loop's job, not theirs.
//
//   node acceptance.mjs <project dir>   prints one JSON line per check, and exits 0 when all pass
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const project = path.resolve(process.argv[2] ?? '.');
const here = path.dirname(new URL(import.meta.url).pathname);
const tsx = path.join(project, 'node_modules', '.bin', 'tsx');

// The file with only USD invoices is data/invoices.json as it was before the session (SETUP_COMMIT): an agent may
// add EUR or GBP invoices to the sample file to show the feature, and the file is then no longer USD-only.
function usdOnlyFile() {
  const setup = process.env.SETUP_COMMIT;
  const show = setup ? spawnSync('git', ['show', `${setup}:data/invoices.json`], { cwd: project, encoding: 'utf8' }) : null;
  if (show?.status !== 0) return path.join(project, 'data', 'invoices.json');
  const file = path.join(mkdtempSync(path.join(os.tmpdir(), 'judge-usd-')), 'invoices.json');
  writeFileSync(file, show.stdout);
  return file;
}
const usdOnly = usdOnlyFile();

function cli(...args) {
  const run = spawnSync(tsx, ['src/cli.ts', ...args], { cwd: project, encoding: 'utf8', timeout: 60_000 });
  return { status: run.status, stdout: run.stdout ?? '', stderr: run.stderr ?? '' };
}

const fixture = (name) => path.join(here, name);
const expected = (name) => readFileSync(path.join(here, 'expected', name), 'utf8');
const results = [];

function check(name, fn) {
  try {
    const problem = fn();
    results.push({ name, pass: !problem, ...(problem ? { detail: problem } : {}) });
  } catch (error) {
    results.push({ name, pass: false, detail: String(error?.message ?? error).slice(0, 400) });
  }
}

/** What is missing from the output, and what must not be in it. */
function contains(output, present, absent = []) {
  const missing = present.filter((s) => !output.includes(s));
  const found = absent.filter((s) => output.includes(s));
  if (missing.length || found.length) {
    return [missing.length && `missing ${missing.join(', ')}`, found.length && `should not show ${found.join(', ')}`]
      .filter(Boolean)
      .join('; ');
  }
  return null;
}

function ran(run) {
  return run.status === 0 ? null : `exit ${run.status}: ${run.stderr.trim().split('\n').slice(-3).join(' | ')}`;
}

// A file with only USD invoices prints as it did before the change.
check('usd-only summary unchanged', () => {
  const run = cli('summary', usdOnly);
  return ran(run) ?? (run.stdout === expected('usd-summary.txt') ? null : 'output differs from before the change');
});
check('usd-only aging unchanged', () => {
  const run = cli('aging', usdOnly, '--today', '2026-11-01');
  return ran(run) ?? (run.stdout === expected('usd-aging.txt') ? null : 'output differs from before the change');
});

// The summary never adds up different currencies, and prints each with its sign.
check('summary totals per currency', () => {
  const run = cli('summary', fixture('mixed.json'));
  return (
    ran(run) ??
    contains(
      run.stdout,
      ['$3,900.00', '$1,200.00', '$2,700.00', '€1,471.06', '€685.87', '€785.19', '£357.00', '£0.00'],
      ['5,728.06', '1,885.87', '3,842.19'],
    )
  );
});
check('summary rows per customer and currency', () => {
  const run = cli('summary', fixture('mixed.json'));
  return (
    ran(run) ??
    contains(
      run.stdout,
      ['$2,100.00', '$900.00', '€571.20', '€899.86', '€213.99', '$1,800.00'],
      ['2,671.20', '2,157.00', '$571.20', '$357.00', '$899.86'],
    )
  );
});

// Aging, per currency.
check('aging per currency', () => {
  const run = cli('aging', fixture('mixed.json'), '--today', '2026-11-01');
  return ran(run) ?? contains(run.stdout, ['$900.00', '$1,800.00', '$2,700.00', '€571.20', '£357.00'], ['3,628.20', '$571.20', '$357.00']);
});

// The CSV gets a currency column right after total; an invoice without one is USD.
check('csv currency column', () => {
  const run = cli('csv', fixture('mixed.json'));
  if (ran(run)) return ran(run);
  const [header, ...rows] = run.stdout.trim().split('\n').map((line) => line.split(','));
  const want = ['id', 'customer', 'issued_on', 'due_on', 'subtotal', 'discount', 'tax', 'total', 'currency', 'paid'];
  if (header.join(',') !== want.join(',')) return `header is ${header.join(',')}`;
  const currencies = Object.fromEntries(rows.map((row) => [row[0], row[8]]));
  const wantCurrencies = { 'M-1': 'USD', 'M-2': 'USD', 'M-3': 'EUR', 'M-4': 'EUR', 'M-5': 'EUR', 'M-6': 'GBP', 'M-7': 'USD' };
  const wrong = Object.entries(wantCurrencies).filter(([id, c]) => currencies[id] !== c);
  return wrong.length ? `wrong currency for ${wrong.map(([id]) => `${id} (${currencies[id]})`).join(', ')}` : null;
});
check('csv for usd-only file', () => {
  const run = cli('csv', usdOnly);
  const before = expected('usd-csv-before.txt').trim().split('\n').map((line) => line.split(','));
  const want = before.map((row, i) => [...row.slice(0, 8), i === 0 ? 'currency' : 'USD', ...row.slice(8)].join(',')).join('\n');
  return ran(run) ?? (run.stdout.trim() === want ? null : 'output is not the old CSV with a USD currency column');
});

// Any other currency is an error that names the invoice.
check('unknown currency refused', () => {
  const run = cli('summary', fixture('bad-currency.json'));
  if (run.status === 0) return 'exit 0';
  return /BAD-7/.test(run.stderr + run.stdout) ? null : `the error does not name BAD-7: ${run.stderr.trim().slice(0, 200)}`;
});

for (const result of results) console.log(JSON.stringify(result));
process.exitCode = results.every((r) => r.pass) ? 0 : 1;
