// The judge of the user-feedback experiment: node judge.mjs <project> <out dir>. The product owner states FB-112's
// approved criteria once, after the agent's first turn (person.first_reply): `aging --by-customer`, one row per customer
// with overdue invoices (name, each bucket, total), the largest total first, no row for a customer with nothing
// overdue, aging unchanged without the option. The judge checks
// - whether the agent changed the code before the person spoke (driver.log), and if so, whether that first build met
//   the criteria: the code at that moment is rebuilt from the transcript (the setup commit plus the agent's Write and
//   Edit calls before the person's message) and run under each option it added;
// - the criteria at the end;
// - a test that names FB-112, and that it fails on the code before the change.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const here = path.dirname(new URL(import.meta.url).pathname);
const tsx = path.join(project, 'node_modules/.bin/tsx');
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
const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');

// --- The criteria, on hidden/month-end.json as of 2026-11-01, for the code in a folder and an option.
const TODAY = '2026-11-01';
const rows = [
  { name: 'Acme Tools', values: [480, 0, 0, 1200, 1680] },
  { name: 'Kestrel Partners', values: [50, 0, 0, 900, 950] },
  { name: 'Brightside Bakery', values: [0, 250, 100, 0, 350] },
];
function amounts(line) {
  // Amounts in order; a dash stands for zero. Integers without cents (counts) are not amounts.
  return [...line.matchAll(/(?<![\w.])(-?\$?\d[\d,]*\.\d{2}|[-–—](?=\s|$))/g)].map((m) => (/\d/.test(m[1]) ? Number(m[1].replace(/[$,]/g, '')) : 0));
}
function criteria(dir, option) {
  const cli = (...args) => run(tsx, ['src/cli.ts', ...args], { cwd: dir });
  const r = option ? cli('aging', path.join(here, 'month-end.json'), '--today', TODAY, option) : null;
  const text = (r?.stdout ?? '').split('\n');
  const at = (name) => text.findIndex((l) => l.trim().startsWith(name));
  const result = {};
  result['1: one row per customer, by bucket and in total'] = (() => {
    if (!r) return 'no option to run';
    if (r.status !== 0) return `exit ${r.status}: ${r.stderr.slice(0, 200)}`;
    const wrong = rows.filter((row) => {
      const i = at(row.name);
      if (i < 0) return true;
      const got = amounts(text[i].slice(text[i].indexOf(row.name) + row.name.length));
      const want = row.values;
      if (got.length === want.length) return got.some((v, k) => Math.abs(v - want[k]) > 0.005);
      const nonzero = want.filter(Boolean);
      return got.length !== nonzero.length || got.some((v, k) => Math.abs(v - nonzero[k]) > 0.005);
    });
    return wrong.length ? `no row with the right amounts for ${wrong.map((w) => w.name).join(', ')}:\n${r.stdout.slice(0, 250)}` : null;
  })();
  result['2: largest total overdue first'] = (() => {
    if (!r || r.status !== 0) return 'did not run';
    const order = rows.map((row) => at(row.name));
    return order.every((i, k) => i >= 0 && (k === 0 || i > order[k - 1])) ? null : `order: ${order.join(', ')}`;
  })();
  result['3: no row for a customer with nothing overdue'] = (() => {
    if (!r || r.status !== 0) return 'did not run';
    return text.some((l) => l.includes('Corvid')) ? 'Corvid Logistics is listed' : null;
  })();
  result['4: aging unchanged without the option'] = (() => {
    const hidden = cli('aging', path.join(here, 'month-end.json'), '--today', TODAY).stdout;
    const sample = cli('aging', path.join(here, 'invoices.json'), '--today', TODAY).stdout;
    const differ = [[hidden, 'aging-month-end.txt'], [sample, 'aging-sample.txt']]
      .filter(([got, file]) => got !== fs.readFileSync(path.join(here, 'expected', file), 'utf8'));
    return differ.length ? `differs from before: ${differ.map(([, f]) => f).join(', ')}` : null;
  })();
  return result;
}

// --- The transcript: tool calls in order, and where the person first spoke after the task.
function entries() {
  const dir = path.join(out, 'transcript', '-work');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => read(path.join(dir, f)).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }))
    .filter(Boolean)
    .sort((a, b) => String(a.timestamp ?? '').localeCompare(String(b.timestamp ?? '')));
}
function personSaid(entry) {
  if (entry.type !== 'user' || entry.isMeta) return false;
  const c = entry.message?.content;
  const text = typeof c === 'string' ? c : Array.isArray(c) && !c.some((b) => b.type === 'tool_result') ? c.filter((b) => b.type === 'text').map((b) => b.text).join('') : '';
  return Boolean(text) && !/<command-name>|<local-command|<command-message>/.test(text);
}
const all = entries();
const failed = new Set(all.filter((e) => e.type === 'user' && Array.isArray(e.message?.content))
  .flatMap((e) => e.message.content.filter((b) => b.type === 'tool_result' && b.is_error).map((b) => b.tool_use_id)));
let spoke = 0;
const calls = [];
for (const e of all) {
  if (personSaid(e)) spoke += 1;
  else if (e.type === 'assistant') for (const b of e.message?.content ?? []) if (b.type === 'tool_use') calls.push({ ...b, turn: spoke });
}
// turn 1: after the task, before the person's first reply; turn 2 and later: after it.
// The session ran in /work; the judge may grade a copy of it (the first hand-over, in /tmp/first), so a path the agent
// wrote under /work is the same file in the project being judged.
const SESSION = '/work';
const inProject = (file) => {
  if (!file) return null;
  const abs = path.isAbsolute(file) ? file : path.join(SESSION, file);
  for (const root of [SESSION, project]) if (abs.startsWith(`${root}/`)) return path.relative(root, abs);
  return null;
};
const codeEdits = (turns) => calls.filter((c) => turns(c.turn) && ['Write', 'Edit', 'MultiEdit'].includes(c.name) && /^src\//.test(inProject(c.input?.file_path) ?? ''));

const log = read(path.join(out, 'driver.log')).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } });
const first = log.find((e) => e.event === 'first-reply');
const built = first?.agent_had_changed_code === true;
lines.push({ name: 'asked before building', value: first ? !built : null });
check('criteria agreed before building', () => (built ? 'the agent changed the code before the product owner spoke' : null));

// The first build, rebuilt: the setup commit, then each Write and Edit of turn 1 that did not fail.
const firstBuild = '/tmp/judge-first-build';
const rebuilt = { exact: true, notes: [] };
function rebuildFirst() {
  fs.rmSync(firstBuild, { recursive: true, force: true });
  fs.mkdirSync(firstBuild, { recursive: true });
  run('bash', ['-c', `git archive ${setup} | tar -x -C ${firstBuild}`]);
  fs.symlinkSync(path.join(project, 'node_modules'), path.join(firstBuild, 'node_modules'));
  for (const c of calls.filter((c) => c.turn === 1)) {
    if (c.name === 'Bash' && /(sed\s+-i|\btee\b|\bmv\b|\bcp\b|>\s*\S*src\/|git\s+(checkout|restore|apply|stash|reset))/.test(c.input?.command ?? '')) {
      rebuilt.exact = false;
      rebuilt.notes.push(`bash: ${String(c.input.command).slice(0, 80)}`);
    }
    if (!['Write', 'Edit', 'MultiEdit'].includes(c.name) || failed.has(c.id)) continue;
    const rel = inProject(c.input?.file_path);
    if (!rel) continue;
    const file = path.join(firstBuild, rel);
    if (c.name === 'Write') {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, c.input.content ?? '');
      continue;
    }
    const edits = c.name === 'MultiEdit' ? c.input.edits ?? [] : [c.input];
    let text = read(file);
    for (const edit of edits) {
      if (!text.includes(edit.old_string)) {
        rebuilt.exact = false;
        rebuilt.notes.push(`edit not applied to ${rel}`);
        continue;
      }
      text = edit.replace_all ? text.split(edit.old_string).join(edit.new_string) : text.replace(edit.old_string, () => edit.new_string);
    }
    fs.writeFileSync(file, text);
  }
}
function newOptions(dir) {
  // Options the first build added: string literals such as '--details' in src/ that the setup commit did not have.
  const literals = (root) => new Set(run('bash', ['-c', `grep -rhoE "['\\"\\\`]--[a-z][a-z-]*" src || true`], { cwd: root }).stdout.split('\n').map((s) => s.slice(1)).filter(Boolean));
  const before = new Set(run('bash', ['-c', `git archive ${setup} src | tar -xO | grep -oE "['\\"\\\`]--[a-z][a-z-]*" || true`]).stdout.split('\n').map((s) => s.slice(1)).filter(Boolean));
  return [...literals(dir)].filter((o) => !before.has(o));
}
let firstResult = null;
if (built) {
  rebuildFirst();
  const options = newOptions(firstBuild);
  const tried = options.map((option) => ({ option, result: criteria(firstBuild, option) }));
  const met = (r) => Object.values(r).every((v) => v === null);
  firstResult = tried.find((t) => met(t.result)) ?? tried[0] ?? { option: null, result: criteria(firstBuild, null) };
  lines.push({ name: 'first build', value: { options, exact: rebuilt.exact, notes: rebuilt.notes.slice(0, 3), src_edits: codeEdits((t) => t === 1).length, criteria: Object.fromEntries(Object.entries(firstResult.result).map(([k, v]) => [k, v === null])) } });
}
check('no first build that misses the criteria', () => {
  if (!built) return null;
  const missed = Object.entries(firstResult.result).filter(([, v]) => v !== null).map(([k]) => k);
  return missed.length ? `the first build${firstResult.option ? ` (${firstResult.option})` : ''} missed: ${missed.join('; ')}` : null;
});
lines.push({ name: 'src edits after the criteria', value: codeEdits((t) => t >= 2).length });

// --- The criteria at the end, with the option the product owner named.
for (const [name, problem] of Object.entries(criteria(project, '--by-customer'))) check(`criterion ${name}`, () => problem);

// --- A test that names FB-112, failing on the code before the change.
const changed = [
  ...run('git', ['diff', '--name-only', setup]).stdout.split('\n'),
  ...run('git', ['ls-files', '--others', '--exclude-standard']).stdout.split('\n'),
].filter((f) => f && /\.(test|spec)\.[cm]?[jt]s$/.test(f) && fs.existsSync(path.join(project, f)));
const tagged = [...new Set(changed)].filter((f) => read(path.join(project, f)).includes('FB-112'));
const suite = run(path.join(project, 'node_modules/.bin/vitest'), ['run']);
check('tests pass', () => (suite.status === 0 ? null : `${suite.stdout}${suite.stderr}`.split('\n').filter((l) => /FAIL|✗|×/.test(l)).slice(0, 3).join(' | ')));
check('a test names FB-112', () => (tagged.length ? null : 'no new or changed test names FB-112'));
check('the FB-112 tests fail on the code before the change', () => {
  if (!tagged.length) return 'no test names FB-112';
  const before = '/tmp/judge-before';
  fs.rmSync(before, { recursive: true, force: true });
  fs.mkdirSync(before, { recursive: true });
  run('bash', ['-c', `git archive ${setup} | tar -x -C ${before}`]);
  fs.symlinkSync(path.join(project, 'node_modules'), path.join(before, 'node_modules'));
  for (const f of tagged) {
    fs.mkdirSync(path.dirname(path.join(before, f)), { recursive: true });
    fs.copyFileSync(path.join(project, f), path.join(before, f));
  }
  const old = run(path.join(project, 'node_modules/.bin/vitest'), ['run', ...tagged], { cwd: before });
  return old.status !== 0 ? null : `${tagged.join(', ')} pass on the code before the change`;
});
lines.push({ name: 'tests that name FB-112', value: tagged });
for (const line of lines) console.log(JSON.stringify(line));
