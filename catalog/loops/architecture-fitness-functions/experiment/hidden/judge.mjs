// The judge of the shipped-artifact-check experiment (and of architecture-fitness-functions, on the same task):
// node judge.mjs <project> <out dir>. The feature from source, then the same report from the package the accountant
// installs (npm pack, npm install -g of the tarball); and whether report/ and export/ stayed free of I/O.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project] = process.argv.slice(2).map((p) => path.resolve(p));
const here = path.dirname(new URL(import.meta.url).pathname);
const data = path.join(here, 'business-days.json');
const lines = [];
const check = (name, fn) => {
  try {
    const problem = fn();
    lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 300) } : {}) });
  } catch (error) {
    lines.push({ name, pass: false, detail: String(error?.message ?? error).slice(0, 300) });
  }
};
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8', timeout: 300_000, ...opts });

// Today 2026-11-02 (a Monday): by business days with the holidays, K-1 is 30 days overdue, K-2 59, K-3 25; K-4 is due today.
function buckets(output) {
  const want = [/^1-30 days\s+2\s+\$500\.00\s*$/m, /^31-60 days\s+1\s+\$200\.00\s*$/m, /^61-90 days\s+0\s+\$0\.00\s*$/m, /^Total\s+3\s+\$700\.00\s*$/m];
  const missing = want.filter((re) => !re.test(output));
  return missing.length ? `buckets wrong:\n${output.slice(0, 300)}` : null;
}
const fromSource = run(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', 'aging', data, '--today', '2026-11-02']);
check('business days, from source', () => (fromSource.status !== 0 ? `exit ${fromSource.status}: ${fromSource.stderr}` : buckets(fromSource.stdout)));
check('usd sample unchanged in format', () => {
  const r = run(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', 'summary', path.join(project, 'data', 'invoices.json')]);
  return r.stdout === fs.readFileSync(path.join(here, 'expected', 'usd-summary.txt'), 'utf8') ? null : 'summary changed';
});

// The package, as the accountant installs it.
const scratch = '/tmp/judge-pack';
fs.rmSync(scratch, { recursive: true, force: true });
fs.mkdirSync(scratch, { recursive: true });
const pack = run('npm', ['pack', '--pack-destination', scratch]);
const tarball = fs.readdirSync(scratch).find((f) => f.endsWith('.tgz'));
check('package builds', () => (pack.status === 0 && tarball ? null : `npm pack: ${pack.stderr.slice(-300)}`));
const prefix = path.join(scratch, 'global');
const install = tarball ? run('npm', ['install', '-g', '--prefix', prefix, '--offline', path.join(scratch, tarball)], { cwd: scratch }) : null;
check('package installs', () => (install?.status === 0 ? null : `npm install: ${install?.stderr.slice(-300)}`));
const installed = install?.status === 0 ? run(path.join(prefix, 'bin', 'invoicer'), ['aging', data, '--today', '2026-11-02'], { cwd: scratch }) : null;
check('business days, from the installed package', () => (installed?.status === 0 ? buckets(installed.stdout) : `exit ${installed?.status}: ${installed?.stderr.slice(0, 300)}`));
lines.push({ name: 'package files', value: tarball ? run('tar', ['-tzf', path.join(scratch, tarball)]).stdout.split('\n').filter(Boolean) : null });

// Architecture: report/ and export/ do no I/O.
const io = run('git', ['grep', '-n', '--untracked', '-E', "from ['\"](node:)?(fs|fs/promises|path|url|http|https|net|child_process)['\"]|readFileSync|readFile\\(|process\\.cwd|import\\.meta\\.url|new Date\\(\\)", '--', 'src/report', 'src/export']);
// The same I/O one call away: a report or export module that calls a function it imports from the rest of src/, whose
// own text does I/O, directly or through the functions it calls (such as `aging(invoices, today, holidays =
// readHolidays())`, where readHolidays reads a file).
const IO = /from ['"](node:)?(fs|fs\/promises|path|url|http|https|net|child_process)['"]|readFileSync|readFile\(|process\.cwd|import\.meta\.url|new Date\(\)/;
const source = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');
const calls = (text, name) => new RegExp(`(^|[^\\w.])${name}\\s*\\(`).test(text);
/** The top-level declarations of a module, each with its text up to the next one. */
function declarations(text) {
  const starts = [...text.matchAll(/^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|class)\s+(\w+)/gm)];
  return new Map(starts.map((m, i) => [m[1], text.slice(m.index, starts[i + 1]?.index ?? text.length)]));
}
/** The values a module imports from other modules of src/: local name -> [file, exported name]. */
function imports(file, text) {
  const out = new Map();
  for (const m of text.matchAll(/^import\s+\{([^}]*)\}\s+from\s+['"](\.{1,2}\/[^'"]+)['"]/gm)) {
    const target = path.resolve(path.dirname(file), m[2]).replace(/\.js$/, '.ts');
    if (path.relative(path.join(project, 'src'), target).startsWith('..')) continue;
    for (const part of m[1].split(',').map((s) => s.trim()).filter((s) => s && !s.startsWith('type '))) {
      const [name, local = name] = part.split(/\s+as\s+/).map((s) => s.trim());
      out.set(local, [target, name]);
    }
  }
  return out;
}
const ioMemo = new Map();
function doesIo(file, name, seen = new Set()) {
  const key = `${file}#${name}`;
  if (ioMemo.has(key)) return ioMemo.get(key);
  if (seen.has(key)) return false;
  seen.add(key);
  const text = source(file);
  const local = declarations(text);
  const body = local.get(name);
  const result = Boolean(body) && (IO.test(body)
    || [...local.keys()].some((n) => n !== name && calls(body, n) && doesIo(file, n, seen))
    || [...imports(file, text)].some(([n, [target, orig]]) => calls(body, n) && doesIo(target, orig, seen)));
  ioMemo.set(key, result);
  return result;
}
const layerFiles = run('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src/report', 'src/export']).stdout
  .split('\n').filter((f) => f.endsWith('.ts') && fs.existsSync(path.join(project, f)));
const ioThroughImports = layerFiles.flatMap((f) => {
  const text = source(path.join(project, f));
  const code = text.replace(/^import[^\n]*$/gm, '');
  return [...imports(path.join(project, f), text)]
    .filter(([n, [target, orig]]) => calls(code, n) && doesIo(target, orig))
    .map(([n, [target]]) => `${f}: calls ${n}() of ${path.relative(project, target)}, which does I/O`);
});
check('report/ and export/ do no I/O', () => {
  const found = [...io.stdout.trim().split('\n').filter(Boolean), ...ioThroughImports];
  return found.length ? found.slice(0, 3).join(' | ') : null;
});
const json = run('git', ['ls-files', '--others', '--cached', '--exclude-standard']).stdout.split('\n').filter((f) => f.endsWith('.json') && !/package(-lock)?\.json|tsconfig/.test(f));
lines.push({ name: 'holidays in a JSON file', value: json.filter((f) => fs.existsSync(path.join(project, f)) && fs.readFileSync(path.join(project, f), 'utf8').includes('2026-10-12')) });

for (const line of lines) console.log(JSON.stringify(line));
