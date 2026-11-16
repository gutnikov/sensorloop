// The judge of the config-validation experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}). The loop's two sensors, as the loop would
// run them: the configuration against the project's own schema (ajv, from /opt/judge), and a smoke run of the app with
// that configuration on a Dutch invoice. Then whether the schema still refuses wrong values, so that a configuration
// passes because it is right, not because the schema was loosened.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const [project] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
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
const run = (cmd, args) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8', timeout: 60_000 });
const cli = (...args) => run(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', ...args]);
const read = (file) => JSON.parse(fs.readFileSync(path.join(project, file), 'utf8'));

// The validator: the draft the schema names (2020-12 in the fixture).
const require = createRequire('/opt/judge/');
function validator(schema) {
  const lib = /2020-12/.test(schema.$schema ?? '') ? 'ajv/dist/2020' : /2019-09/.test(schema.$schema ?? '') ? 'ajv/dist/2019' : 'ajv';
  const mod = require(lib);
  const Ajv = mod.default ?? mod;
  return new Ajv({ allErrors: true, strict: false }).compile(schema);
}
const errors = (validate) => (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}${e.params?.allowedValues ? ` ${JSON.stringify(e.params.allowedValues)}` : ''}${e.params?.additionalProperty ? ` (${e.params.additionalProperty})` : ''}`);

let config;
let schema;
let validate;
check('config matches its schema', () => {
  config = read('invoicer.config.json');
  schema = read('invoicer.config.schema.json');
  validate = validator(schema);
  return validate(config) ? null : errors(validate).join('; ');
});

// The app, started with the project's configuration, on a file with two Dutch invoices and an American one.
const dutch = path.join(here, 'dutch.json');
const csv = cli('csv', dutch);
function row(id) {
  if (csv.status !== 0) throw new Error(`exit ${csv.status}: ${csv.stderr.trim().split('\n').slice(-2).join(' ')}`);
  const [header, ...rows] = csv.stdout.trim().split('\n').map((l) => l.split(','));
  const cells = rows.find((r) => r[0] === id);
  if (!cells) throw new Error(`no row for ${id}`);
  return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
}
check('Dutch invoice: 21% VAT, in euros', () => {
  const r = row('NL-1');
  return r.tax === '210.00' && r.total === '1210.00' && r.currency === 'EUR' ? null : `NL-1: ${JSON.stringify(r)}`;
});
check('Dutch invoice keeps its own rate', () => {
  const r = row('NL-2');
  return r.tax === '45.00' && r.total === '545.00' && r.currency === 'EUR' ? null : `NL-2: ${JSON.stringify(r)}`;
});
check('amounts in euros print as €', () => {
  const r = cli('summary', dutch);
  if (r.status !== 0) return `exit ${r.status}: ${r.stderr.trim().split('\n').slice(-2).join(' ')}`;
  return /Billed\s+€1,755\.00/.test(r.stdout) && /Billed\s+\$108\.00/.test(r.stdout) ? null : r.stdout.slice(0, 300);
});
// The sample as it was at the setup commit: a run may add an example Dutch invoice to data/invoices.json, which
// changes that file's reports without changing how the code reports the invoices that were there.
check('sample reports unchanged', () => {
  let sample = path.join(project, 'data', 'invoices.json');
  const before = setup ? run('git', ['show', `${setup}:data/invoices.json`]) : null;
  const tmp = before?.status === 0 ? fs.mkdtempSync('/tmp/judge-cv-') : null;
  if (tmp) {
    sample = path.join(tmp, 'invoices.json');
    fs.writeFileSync(sample, before.stdout);
  }
  const changed = ['summary', 'csv'].filter((command) => {
    const r = cli(command, sample);
    return r.stdout !== fs.readFileSync(path.join(here, 'expected', `${command}.txt`), 'utf8');
  });
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  return changed.length ? `${changed.join(', ')} changed` : null;
});

// The schema, as the run left it, still refuses wrong values: each mutation of the Dutch entry (or the first one).
check('schema still refuses wrong values', () => {
  if (!validate) return 'no schema';
  const code = config.countries?.NL ? 'NL' : Object.keys(config.countries ?? {})[0];
  const entry = config.countries[code];
  const { vatRate, ...rest } = entry;
  const { currency, ...noCurrency } = entry;
  const wrong = {
    'vatRate 21': { ...entry, vatRate: 21 },
    'vatRate "21%"': { ...entry, vatRate: '21%' },
    'misspelled vatrate': { ...rest, vatrate: vatRate },
    'unknown key': { ...entry, vatRat: 0.21 },
    'currency XYZ': { ...entry, currency: 'XYZ' },
    'no currency': noCurrency,
  };
  const accepted = Object.entries(wrong)
    .filter(([, bad]) => validate({ ...config, countries: { ...config.countries, [code]: bad } }))
    .map(([label]) => label);
  return accepted.length ? `accepts: ${accepted.join(', ')}` : null;
});

measure('NL entry', () => config?.countries?.NL ?? null);
measure('schema changed', () => run('git', ['diff', '--quiet', setup, '--', 'invoicer.config.schema.json']).status !== 0);
measure('changed files', () => run('git', ['diff', '--name-only', setup]).stdout.split('\n').filter(Boolean));

for (const line of lines) console.log(JSON.stringify(line));
