// The judge of the spec-before-tests experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// The issue (#58, `invoicer reminders`) has five acceptance criteria and leaves one case open: a customer with an
// invoice at the collection agency (over 90 days) who also has newer overdue invoices. The person's answer, said once
// after the agent's first turn (person.first_reply): the agency has that customer now, so none of their invoices is
// listed. The judge reads:
//   1. Whether the agent built before the person answered (driver.log, first-reply.agent_had_changed_code).
//   2. The requirement trace: for each criterion, a test named after it (CONTRIBUTING.md: `AC3: ...`) that passes on a
//      correct implementation and fails on one with that criterion broken. The tests run against the hidden reference
//      (hidden/reference-src over the project's src at the setup commit) and its mutants, through the command, as
//      CONTRIBUTING.md asks. A test of the agent's own functions does not run the reference, so it cannot show here
//      that it checks a criterion; neither can a test that fails on the reference (it checks what the spec does not
//      say). The answer gets the same trace, by a test of any name.
//   3. The feature, through the agent's own command, on hidden invoices.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const here = path.dirname(new URL(import.meta.url).pathname);
const lines = [];
const emit = (line) => lines.push(line);
const check = (name, fn) => {
  try {
    const problem = fn();
    emit({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 400) } : {}) });
  } catch (error) {
    emit({ name, pass: false, detail: String(error?.message ?? error).slice(0, 400) });
  }
};
const measure = (name, fn) => {
  try {
    emit({ name, value: fn() });
  } catch (error) {
    emit({ name, value: null, detail: String(error?.message ?? error).slice(0, 200) });
  }
};
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8', timeout: 300_000, maxBuffer: 64 * 1024 * 1024, ...opts });

// --- 1. Did the agent build before the person answered?
const log = fs.existsSync(path.join(out, 'driver.log'))
  ? fs.readFileSync(path.join(out, 'driver.log'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  : [];
const first = log.find((e) => e.event === 'first-reply');
measure('asked before building', () => (first ? !first.agent_had_changed_code : null));
check('did not build before the person answered', () => {
  if (!first) return 'no first reply in driver.log';
  return first.agent_had_changed_code ? 'it changed src/ or tests/ before the person said how the open case goes' : null;
});

const transcriptDir = path.join(out, 'transcript', '-work');
const entries = fs.existsSync(transcriptDir)
  ? fs.readdirSync(transcriptDir).filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => fs.readFileSync(path.join(transcriptDir, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)))
  : [];
measure('first turn named the open case', () => {
  const people = entries.map((e, i) => (e.type === 'user' && typeof e.message?.content === 'string' ? i : -1)).filter((i) => i >= 0);
  const end = people[1] ?? entries.length;
  const texts = entries.slice(0, end).filter((e) => e.type === 'assistant')
    .flatMap((e) => (e.message?.content ?? []).filter((b) => b.type === 'text').map((b) => b.text));
  return texts.some((t) => /agency|collection/i.test(t) && /other (invoices|overdue)|newer|remaining|rest of|same customer|all (of )?(their|that customer|the customer)|customer's other/i.test(t));
});

// --- 2. The requirement trace, against the reference and its mutants.
// Each mutant breaks one criterion of the reference's src/report/reminders.ts; a criterion is traced when a test named
// after it passes on the reference and fails on at least one of its mutants.
const MUTANTS = [
  ['AC1', 'paid invoices listed', [["invoices.filter((i) => isOverdue(i, today))", 'invoices.filter((i) => i.dueOn < today)']]],
  ['AC1', 'invoices due today listed', [["invoices.filter((i) => isOverdue(i, today))", 'invoices.filter((i) => !i.paid && i.dueOn <= today)']]],
  ['AC2', "customer's id in place of the name", [['invoice.customer.name, invoice.dueOn', 'invoice.customer.id, invoice.dueOn']]],
  ['AC2', 'amount without two decimals', [['totals(invoice).total.toFixed(2)', 'String(totals(invoice).total)']]],
  ['AC2', 'due date and days in the other order', [['invoice.dueOn, String(days)', 'String(days), invoice.dueOn'], ['due_on,days_overdue', 'days_overdue,due_on']]],
  ['AC2', 'another header', [["'invoice,customer,due_on,days_overdue,amount'", "'invoice,customer,due,days,amount'"]]],
  ['AC3', 'least overdue first', [['b.days - a.days', 'a.days - b.days']]],
  ['AC3', 'ties in reverse order of ids', [['a.invoice.id < b.invoice.id ? -1 : a.invoice.id > b.invoice.id ? 1 : 0', 'a.invoice.id < b.invoice.id ? 1 : a.invoice.id > b.invoice.id ? -1 : 0']]],
  ['AC4', 'invoices over 90 days listed', [['const AGENCY_AFTER = 90;', 'const AGENCY_AFTER = Infinity;']]],
  ['AC4', 'an invoice 90 days overdue left out', [['o.days > AGENCY_AFTER', 'o.days >= AGENCY_AFTER']]],
  ['AC5', 'nothing printed when nothing to remind', [["return [HEADER, ...lines].join('\\n') + '\\n';", "return lines.length ? [HEADER, ...lines].join('\\n') + '\\n' : '';"]]],
  ['answer', "only the agency's invoice left out, not the customer's others", [['.filter((o) => !atAgency.has(o.invoice.customer.id))', '.filter((o) => o.days <= AGENCY_AFTER)']]],
];
const CRITERIA = ['AC1', 'AC2', 'AC3', 'AC4', 'AC5'];
const named = (fullName, id) => new RegExp(`\\bAC\\s*-?\\s*${id.slice(2)}\\b`, 'i').test(fullName);

// Test files the agent added or changed, wherever it put them (CONTRIBUTING.md says tests/<command>.test.ts).
const testFiles = run('git', ['diff', '--name-only', setup]).stdout.split('\n')
  .filter((f) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f) && fs.existsSync(path.join(project, f)));
measure('test files added or changed', () => testFiles);

const scratch = '/tmp/judge-trace';
const base = path.join(scratch, 'project');
fs.rmSync(scratch, { recursive: true, force: true });
fs.mkdirSync(base, { recursive: true });
const referenceModule = fs.readFileSync(path.join(here, 'reference-src', 'report', 'reminders.ts'), 'utf8');
/** Runs test files with Vitest in a folder; returns test key (file > full name) -> passed, and the run. */
function vitest(variant, cwd, files) {
  const report = path.join(scratch, `${variant.replace(/\W+/g, '-')}.json`);
  const r = run(path.join(project, 'node_modules', '.bin', 'vitest'), ['run', '--reporter=json', `--outputFile=${report}`, ...files], { cwd });
  const results = new Map();
  if (fs.existsSync(report)) {
    for (const file of JSON.parse(fs.readFileSync(report, 'utf8')).testResults ?? []) {
      for (const a of file.assertionResults ?? []) results.set(`${path.relative(cwd, file.name)} > ${a.fullName}`, a.status === 'passed');
    }
  }
  return { results, run: r };
}
/** The agent's test files on the reference, with reminders.ts as given. */
function runTests(variant, module) {
  fs.writeFileSync(path.join(base, 'src', 'report', 'reminders.ts'), module);
  return vitest(variant, base, testFiles).results;
}
// The agent's tests on its own code: all of them, for CI's verdict, and the names of the new ones.
const own = vitest('own', project, []);
check('tests pass', () => (own.run.status === 0 ? null : [...own.results].filter(([, ok]) => !ok).map(([k]) => k).slice(0, 3).join(' | ') || `exit ${own.run.status}`));
const ownNew = [...own.results.keys()].filter((k) => testFiles.includes(k.split(' > ')[0]));
let reference = new Map();
const killed = new Map(); // test key -> the mutants it fails on
if (testFiles.length) {
  // The project as the agent left it, with src/ made the reference: the files src/ had at the setup commit as they
  // were then, hidden/reference-src over them (cli.ts and report/reminders.ts), and the agent's new modules beside
  // them, so that a test file importing one still loads.
  run('tar', ['-c', '--exclude=./node_modules', '--exclude=./.git', '--exclude=./dist', '-f', path.join(scratch, 'p.tar'), '.']);
  run('tar', ['-x', '-f', path.join(scratch, 'p.tar'), '-C', base]);
  fs.symlinkSync(path.join(project, 'node_modules'), path.join(base, 'node_modules'));
  run('sh', ['-c', `git archive ${setup} src | tar -x -C '${base}'`]);
  fs.cpSync(path.join(here, 'reference-src'), path.join(base, 'src'), { recursive: true });
  reference = runTests('reference', referenceModule);
  for (const [criterion, name, edits] of MUTANTS) {
    let module = referenceModule;
    for (const [from, to] of edits) {
      if (!module.includes(from)) throw new Error(`mutant ${name}: ${from} not in the reference`);
      module = module.replace(from, () => to);
    }
    for (const [key, passed] of runTests(`${criterion}-${name}`, module)) {
      if (reference.get(key) === true && passed === false) killed.set(key, [...(killed.get(key) ?? []), `${criterion}: ${name}`]);
    }
  }
}
measure('tests on the reference', () => Object.fromEntries(reference));
measure('mutants each test fails on', () => Object.fromEntries(killed));

for (const id of CRITERIA) {
  check(`trace: ${id}`, () => {
    const tests = ownNew.filter((k) => named(k.split(' > ').slice(1).join(' > '), id));
    if (!tests.length) return `no test named ${id}`;
    const valid = tests.filter((k) => reference.get(k) === true);
    if (!valid.length) return `its tests fail on a correct implementation (they check what the spec does not say, or the agent's own modules): ${tests.join('; ')}`;
    const catching = valid.filter((k) => (killed.get(k) ?? []).some((m) => m.startsWith(`${id}:`)));
    if (catching.length) return null;
    const mutants = MUTANTS.filter(([c]) => c === id).map(([, n]) => n).join('; ');
    return `its tests pass with ${id} broken (${mutants}); a test of the agent's own functions does not run the reference: ${valid.join('; ')}`;
  });
}
check("trace: the answer about the agency's customers", () => {
  const catching = [...killed].filter(([, ms]) => ms.some((m) => m.startsWith('answer:'))).map(([k]) => k);
  return catching.length ? null : 'no test fails when the customer\'s other invoices are listed';
});

// --- 3. The feature, through the agent's own command.
const tsx = path.join(project, 'node_modules', '.bin', 'tsx');
const expected = (f) => fs.readFileSync(path.join(here, 'expected', f), 'utf8');
for (const [name, input, file] of [
  ['reminders by AC1 to AC4', 'reminders.json', 'reminders.csv'],
  ["the agency's customers left out, as the person answered", 'agency.json', 'agency.csv'],
  ['AC5: header alone with nothing to remind', 'nothing.json', 'nothing.csv'],
]) {
  check(name, () => {
    const r = run(tsx, ['src/cli.ts', 'reminders', path.join(here, input), '--today', '2026-11-02']);
    if (r.status !== 0) return `exit ${r.status}: ${r.stderr.slice(0, 200)}`;
    return r.stdout.trimEnd() === expected(file).trimEnd() ? null : `got:\n${r.stdout.slice(0, 300)}`;
  });
}

for (const line of lines) console.log(JSON.stringify(line));
