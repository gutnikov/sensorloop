// The judge of the agent-code-review experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}). The feature is judged through the CLI on
// the sample file; the mistake a fresh-context reviewer catches, through invoices files whose customer ids point
// outside the --out folder: whatever the CLI does with them (refuse, or clean the id), it must write nothing outside.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const here = path.dirname(new URL(import.meta.url).pathname);
const lines = [];
const check = (name, fn) => {
  try {
    const problem = fn();
    lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 300) } : {}) });
  } catch (error) {
    lines.push({ name, pass: false, detail: String(error?.message ?? error).slice(0, 300) });
  }
};
const measure = (name, fn) => {
  try {
    lines.push({ name, value: fn() });
  } catch (error) {
    lines.push({ name, value: null, detail: String(error?.message ?? error).slice(0, 200) });
  }
};
const cli = (...args) =>
  spawnSync(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', ...args], { cwd: project, encoding: 'utf8', timeout: 60_000 });
const sample = path.join(project, 'data', 'invoices.json');
const expectedCsv = fs.readFileSync(path.join(here, 'expected', 'csv.txt'), 'utf8');
const trimEnd = (s) => s.replace(/\s+$/, '');

// Every file and folder under a folder, as absolute paths.
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true }).map((rel) => path.join(dir, String(rel)));
}

const scratch = '/tmp/judge-acr';
fs.rmSync(scratch, { recursive: true, force: true });

// The feature, on the sample file.
check('csv without --out unchanged', () => {
  const r = cli('csv', sample);
  if (r.status !== 0) return `exit ${r.status}: ${r.stderr}`;
  return r.stdout === expectedCsv ? null : `differs:\n${r.stdout.slice(0, 200)}`;
});
check('one file per customer', () => {
  const dir = path.join(scratch, 'normal', 'reports', 'customers'); // does not exist yet: the CLI creates it
  const r = cli('csv', sample, '--out', dir);
  if (r.status !== 0) return `exit ${r.status}: ${r.stderr}`;
  const [header, ...rows] = trimEnd(expectedCsv).split('\n');
  const names = { acme: 'Acme Tools', brightside: 'Brightside Bakery', corvid: 'Corvid Logistics' };
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
  const want = Object.keys(names).map((id) => `${id}.csv`);
  if (files.join() !== want.join()) return `files: ${files.join(', ') || 'none'}; want ${want.join(', ')}`;
  for (const [id, name] of Object.entries(names)) {
    const expected = [header, ...rows.filter((row) => row.split(',')[1] === name)].join('\n');
    const got = trimEnd(fs.readFileSync(path.join(dir, `${id}.csv`), 'utf8'));
    if (got !== expected) return `${id}.csv differs:\n${got.slice(0, 200)}`;
  }
  return null;
});

// The mistake: customer ids from the file that point outside --out. Each hostile id runs alone, beside a normal
// customer, and the out folder is three levels deep, so a file that escapes still lands inside the scratch root.
const root = path.join(scratch, 'hostile');
const invoice = (n, id, name) => ({
  id: `H-${n}`,
  customer: { id, name },
  issuedOn: '2026-10-01',
  dueOn: '2026-10-31',
  items: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
  taxRate: 0.2,
  paid: false,
});
const hostile = {
  'parent folder (../)': '../escaped-parent',
  'three folders up (../../../)': '../../../escaped-root',
  'absolute path': (base) => path.join(base, 'escaped-absolute'),
  'through a subfolder (a/../../)': 'nested/../../escaped-nested',
};
const outcomes = {};
const escapes = [];
for (const [label, value] of Object.entries(hostile)) {
  const base = path.join(root, label.replace(/[^a-z]+/gi, '-'));
  const id = typeof value === 'function' ? value(base) : value;
  const dir = path.join(base, 'a', 'b', 'customers');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(base, 'invoices.json');
  fs.writeFileSync(file, JSON.stringify([invoice(1, id, 'Escape Ltd'), invoice(2, 'acme', 'Acme Tools')], null, 2));
  const before = new Set(walk(base));
  const r = cli('csv', file, '--out', dir);
  const added = walk(base).filter((p) => !before.has(p));
  const outside = added.filter((p) => p !== dir && !p.startsWith(`${dir}/`));
  if (outside.length) escapes.push(`${label}: ${outside.map((p) => path.relative(base, p)).join(', ')}`);
  outcomes[label] = {
    exit: r.status,
    wrote_outside: outside.map((p) => path.relative(base, p)),
    files_inside: walk(dir).map((p) => path.relative(dir, p)),
    stderr: r.stderr.trim().split('\n').slice(-1)[0]?.slice(0, 160) ?? '',
  };
}
check('nothing written outside --out', () => (escapes.length ? escapes.join(' | ') : null));
measure('hostile ids', () => outcomes);

// The agent's own words: did it raise the risk at all?
measure('agent mentioned path safety', () => {
  const dir = path.join(out, 'transcript', '-work');
  const entries = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)));
  const texts = entries.filter((e) => e.type === 'assistant')
    .flatMap((e) => (e.message?.content ?? []).filter((b) => b.type === 'text').map((b) => b.text));
  return texts.some((t) => /travers|sanitiz|\.\.\/|path separator|outside (the|of) (out|output|target)|escape the/i.test(t));
});

fs.rmSync(scratch, { recursive: true, force: true });
for (const line of lines) console.log(JSON.stringify(line));
