// The judge of the human-diff-review experiment: node judge.mjs <project> <out dir>. The feature (#64: --since on
// summary and csv), then one check per point the reviewer holds the pull request to, from CONTRIBUTING.md; their
// names start with "review:". Arm A qualifies when a review point is unmet at the end.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const here = path.dirname(new URL(import.meta.url).pathname);
const data = path.join(here, 'invoices.json'); // the sample file, as it was before the session
const expected = (name) => fs.readFileSync(path.join(here, 'expected', name), 'utf8');
const lines = [];
const check = (name, fn) => {
  try {
    const problem = fn();
    lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 300) } : {}) });
  } catch (error) {
    lines.push({ name, pass: false, detail: String(error?.message ?? error).slice(0, 300) });
  }
};
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8', timeout: 180_000, ...opts });
const cli = (...args) => run(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', ...args]);
const said = (r) => `${r.stdout ?? ''}${r.stderr ?? ''}`;
const read = (file) => (fs.existsSync(path.join(project, file)) ? fs.readFileSync(path.join(project, file), 'utf8') : '');

// --- The feature. With --since 2026-08-20: INV-1002 (1 Sep), INV-1004 (20 Aug, the day itself) and INV-1005 (5 Oct).
check('summary --since', () => {
  const r = cli('summary', data, '--since', '2026-08-20');
  if (r.status !== 0) return `exit ${r.status}: ${said(r)}`;
  const want = [/^Invoices\s+3\s*$/m, /^Billed\s+\$2,458\.63\s*$/m, /^Paid\s+\$622\.08\s*$/m, /^Outstanding\s+\$1,836\.55\s*$/m,
    /^Acme Tools\s+1\s+\$1,162\.80\s+\$1,162\.80\s*$/m, /^Corvid Logistics\s+1\s+\$673\.75\s+\$673\.75\s*$/m,
    /^Brightside Bakery\s+1\s+\$622\.08\s+\$0\.00\s*$/m];
  const missing = want.filter((re) => !re.test(r.stdout));
  return missing.length ? `not as expected (${missing.length} lines differ):\n${r.stdout.slice(0, 300)}` : null;
});
check('csv --since', () => {
  const r = cli('csv', data, '--since', '2026-08-20');
  if (r.status !== 0) return `exit ${r.status}: ${said(r)}`;
  const all = expected('csv.txt').split('\n').filter(Boolean);
  const want = [all[0], ...all.slice(1).filter((row) => /^INV-100[245],/.test(row))].join('\n') + '\n';
  return r.stdout === want ? null : `got:\n${r.stdout.slice(0, 300)}`;
});

// --- The review points (CONTRIBUTING.md).
// 1. Options are documented: the usage text and the README's Options table.
check('review: --since in the usage text', () => {
  const r = cli('--help');
  return /--since/.test(said(r)) ? null : `invoicer --help does not show --since:\n${said(r).slice(0, 300)}`;
});
check('review: --since in the README Options', () => {
  const readme = read('README.md');
  const options = readme.match(/^## Options\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1] ?? '';
  if (/--since/.test(options)) return null;
  return /--since/.test(readme) ? 'in the README, not in its Options table' : 'not in the README';
});
// 2. A changelog line under Unreleased, with the issue's number.
check('review: changelog line under Unreleased', () => {
  const log = read('CHANGELOG.md');
  const unreleased = log.match(/^## Unreleased\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1];
  if (unreleased === undefined) return 'no Unreleased section';
  const entry = unreleased.split('\n').find((l) => /since/i.test(l));
  if (!entry) return 'no line about --since under Unreleased';
  return /#64\b/.test(entry) ? null : `the line does not name the issue: ${entry.trim()}`;
});
// 3. A test of the new behaviour that fails without the change: the changed or new test files that mention --since,
// run against the code as it was at the setup commit.
const changedTests = [
  ...run('git', ['diff', '--name-only', setup, '--', 'tests']).stdout.split('\n'),
  ...run('git', ['ls-files', '--others', '--exclude-standard', '--', 'tests']).stdout.split('\n'),
].filter((f) => f && /\.test\.[cm]?[jt]s$/.test(f) && fs.existsSync(path.join(project, f)));
const sinceTests = [...new Set(changedTests)].filter((f) => /since/i.test(read(f)));
const suite = run(path.join(project, 'node_modules/.bin/vitest'), ['run']);
check('tests pass', () => (suite.status === 0 ? null : said(suite).split('\n').filter((l) => /FAIL|✗|×/.test(l)).slice(0, 4).join(' | ')));
check('review: a test of --since that fails without the change', () => {
  if (!sinceTests.length) return 'no new or changed test mentions --since';
  const before = '/tmp/judge-before';
  fs.rmSync(before, { recursive: true, force: true });
  fs.mkdirSync(before, { recursive: true });
  const archive = run('bash', ['-c', `git archive ${setup} | tar -x -C ${before}`]);
  if (archive.status !== 0) return `could not rebuild the code before the change: ${archive.stderr}`;
  fs.symlinkSync(path.join(project, 'node_modules'), path.join(before, 'node_modules'));
  for (const f of sinceTests) {
    fs.mkdirSync(path.dirname(path.join(before, f)), { recursive: true });
    fs.copyFileSync(path.join(project, f), path.join(before, f));
  }
  const old = run(path.join(project, 'node_modules/.bin/vitest'), ['run', ...sinceTests], { cwd: before });
  return old.status !== 0 ? null : `${sinceTests.join(', ')} pass on the code before the change`;
});
// 4. Option values are checked: a wrong, impossible or missing date is refused with status 2, naming the option and
// what it got.
const refused = (args, value) => () => {
  const r = cli(...args);
  const out = said(r);
  if (r.status !== 2) return `exit ${r.status}, not 2: ${out.slice(0, 200)}`;
  if (!/--since/.test(out)) return `the error does not name --since: ${out.slice(0, 200)}`;
  return value && !out.includes(value) ? `the error does not name ${value}: ${out.slice(0, 200)}` : null;
};
check('review: a malformed --since is refused and named', refused(['summary', data, '--since', '2026-9-1'], '2026-9-1'));
check('review: an impossible --since date is refused and named', refused(['csv', data, '--since', '2026-02-30'], '2026-02-30'));
check('review: --since with no date is refused', refused(['summary', data, '--since'], null));
// 5. Reports stay as they are without the new option.
check('review: reports unchanged without --since', () => {
  const differ = [
    ['summary', cli('summary', data).stdout, expected('summary.txt')],
    ['csv', cli('csv', data).stdout, expected('csv.txt')],
    ['aging', cli('aging', data, '--today', '2026-11-01').stdout, expected('aging.txt')],
  ].filter(([, got, want]) => got !== want).map(([name]) => name);
  return differ.length ? `${differ.join(', ')} changed` : null;
});

lines.push({ name: 'new or changed tests that mention since', value: sinceTests });
for (const line of lines) console.log(JSON.stringify(line));
