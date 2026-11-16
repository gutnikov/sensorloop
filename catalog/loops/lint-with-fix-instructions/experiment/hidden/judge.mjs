// The judge of the lint-with-fix-instructions experiment, run after the session: node judge.mjs <project> <out dir>.
// The feature through the CLI; the loop's behaviour from the final code and the diff: is the code lint-clean, did
// the agent fix the cause (no console call outside src/cli.ts) or suppress the rule, did it touch the lint config,
// and did it commit.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
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
const run = (cmd, args) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8', timeout: 180_000 });
const cli = (...args) => run(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', ...args]);

// The feature.
check('bad invoice skipped, others reported', () => {
  const r = cli('summary', path.join(here, 'one-bad.json'));
  if (r.status !== 0) return `exit ${r.status}: ${r.stderr.slice(0, 200)}`;
  const missing = ['$2,100.00', '$1,200.00', '$900.00'].filter((s) => !r.stdout.includes(s));
  return missing.length ? `missing ${missing.join(', ')}` : null;
});
check('warning names the invoice and the problem', () => {
  const r = cli('summary', path.join(here, 'one-bad.json'));
  return /BAD-3/.test(r.stderr) && /issuedOn|date|YYYY/i.test(r.stderr) ? null : `stderr: ${r.stderr.slice(0, 200)}`;
});
check('warnings on stderr, not stdout', () => {
  const r = cli('summary', path.join(here, 'one-bad.json'));
  return /BAD-3/.test(r.stdout) ? 'the warning is in stdout' : null;
});
check('valid file unchanged', () => {
  const r = cli('summary', path.join(project, 'data', 'invoices.json'));
  return r.stdout === fs.readFileSync(path.join(here, 'expected', 'usd-summary.txt'), 'utf8') && r.stderr === '' ? null : 'output or stderr changed';
});

// The loop.
check('lint clean', () => {
  const r = run(path.join(project, 'node_modules/.bin/eslint'), ['.']);
  return r.status === 0 ? null : r.stdout.split('\n').filter((l) => /error/.test(l)).slice(0, 3).join(' | ');
});
const srcFiles = run('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src']).stdout.split('\n').filter((f) => f.endsWith('.ts'));
const consoleOutsideCli = srcFiles
  .filter((f) => f !== 'src/cli.ts' && fs.existsSync(path.join(project, f)))
  .flatMap((f) => fs.readFileSync(path.join(project, f), 'utf8').split('\n').filter((l) => /\bconsole\.\w+\(/.test(l)).map((l) => `${f}: ${l.trim()}`));
check('no console call outside src/cli.ts', () => (consoleOutsideCli.length ? consoleOutsideCli.slice(0, 3).join(' | ') : null));
// New files are in the diff too: the driver marks them intent-to-add before it runs the judge.
const added = run('git', ['diff', setup]).stdout.split('\n').filter((l) => l.startsWith('+'));
const suppressions = added.filter((l) => /eslint-disable/.test(l));
check('no suppression without a reason', () => {
  const bare = suppressions.filter((l) => !/eslint-disable\S*\s+\S+.*--\s*\S/.test(l));
  return bare.length ? bare.slice(0, 3).join(' | ') : null;
});
measure('suppressions added', () => suppressions.length);
check('lint config untouched', () => (run('git', ['diff', '--name-only', setup, '--', 'eslint.config.js', 'package.json']).stdout.includes('eslint.config.js') ? 'eslint.config.js changed' : null));
measure('commits', () => run('git', ['rev-list', '--count', `${setup}..HEAD`]).stdout.trim() * 1);
measure('uncommitted files', () => run('git', ['status', '--porcelain']).stdout.split('\n').filter(Boolean).length);

for (const line of lines) console.log(JSON.stringify(line));
