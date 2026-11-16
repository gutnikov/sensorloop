// The judge of the correction-becomes-rule experiment, run after both sessions: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// Session 1 adds --customer; after its first turn the person corrects it: a filtered report says at the top what it
// covers. Session 2, a fresh Claude Code, adds --month to summary. The judge reads:
// - whether session 1's first hand-over made the mistake (the correction was needed): it rebuilds the code as it was
//   when the person spoke, by replaying the agent's edits from the transcript onto the setup commit, and runs it;
// - whether session 2's result makes it again: the month's summary does not say which month;
// - whether a rule or a memory of the correction was written where a later session reads it.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const here = path.dirname(new URL(import.meta.url).pathname);
const home = process.env.HOME ?? '/home/node';
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

const tsx = path.join(project, 'node_modules/.bin/tsx');
const cli = (dir, ...args) => spawnSync(tsx, ['src/cli.ts', ...args], { cwd: dir, encoding: 'utf8', timeout: 60_000 });
const MONTH_FILE = path.join(here, 'month.json');

// --- What a report that names its filter looks like. The summary lists Acme Tools in its customer table anyway, so
// the customer must appear on another line; aging and the month's summary hold no customer name or date of their own.
const summaryNamesCustomer = (stdout) => stdout.split('\n').some((l) => /acme/i.test(l) && !/^Acme Tools\s{2,}\d+\s{2,}/.test(l));
const agingNamesCustomer = (stdout) => /corvid/i.test(stdout);
const MONTH = /2026-09|09\/2026|2026\/09|\bsep(t|tember)?\.?,?\s+2026/i;

/** The customer filter's outputs in a tree: null when the tree has no working filter yet. */
function customerReports(dir) {
  const summary = cli(dir, 'summary', 'data/invoices.json', '--customer', 'acme');
  const aging = cli(dir, 'aging', 'data/invoices.json', '--customer', 'corvid', '--today', '2026-11-01');
  const filtered = summary.status === 0 && !/Brightside|Corvid/.test(summary.stdout) && aging.status === 0 && !aging.stdout.includes('$4,259.08');
  return filtered ? { summary: summary.stdout, aging: aging.stdout } : null;
}

// --- The transcripts: each session's main file, and the files of the subagents it started.
const transcriptDir = path.join(out, 'transcript', '-work');
const readJsonl = (file) => fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((l) => {
  try {
    return [JSON.parse(l)];
  } catch {
    return [];
  }
});
const textOf = (entry) => {
  const c = entry.message?.content;
  return typeof c === 'string' ? c : Array.isArray(c) ? c.filter((b) => b.type === 'text').map((b) => b.text).join('\n') : '';
};
const sessions = fs.existsSync(transcriptDir)
  ? fs.readdirSync(transcriptDir).filter((f) => f.endsWith('.jsonl')).map((f) => {
    const id = f.slice(0, -'.jsonl'.length);
    const sub = path.join(transcriptDir, id);
    const side = fs.existsSync(sub)
      ? fs.readdirSync(sub, { recursive: true }).map(String).filter((r) => r.endsWith('.jsonl')).flatMap((r) => readJsonl(path.join(sub, r)))
      : [];
    return { id, entries: readJsonl(path.join(transcriptDir, f)), side };
  })
  : [];
const sessionOf = (marker) => sessions.find((s) => textOf(s.entries.find((e) => e.type === 'user' && textOf(e)) ?? {}).includes(marker));
const session1 = sessionOf('#21 Filter the reports by customer');

/**
 * The project as it was at a moment of a session: the setup commit, plus every edit the agent's file tools made
 * before then (its own and its subagents'). A shell command that may have changed files makes the replay inexact.
 */
function replay(session, before) {
  const dir = fs.mkdtempSync('/tmp/replay-');
  const archive = spawnSync('bash', ['-c', `git -C "${project}" archive "${setup}" | tar -x -C "${dir}"`], { encoding: 'utf8' });
  if (archive.status !== 0) throw new Error(`git archive: ${archive.stderr}`);
  fs.symlinkSync(path.join(project, 'node_modules'), path.join(dir, 'node_modules'));
  const all = [...session.entries, ...session.side];
  const failed = new Map();
  for (const e of all) {
    if (e.type !== 'user' || !Array.isArray(e.message?.content)) continue;
    for (const b of e.message.content) if (b.type === 'tool_result') failed.set(b.tool_use_id, b.is_error === true);
  }
  const calls = all.filter((e) => e.type === 'assistant' && e.timestamp < before)
    .flatMap((e) => (e.message?.content ?? []).filter((b) => b.type === 'tool_use').map((b) => ({ ...b, t: e.timestamp })))
    .sort((a, b) => a.t.localeCompare(b.t));
  const target = (file) => path.join(dir, path.relative(project, path.resolve(project, file)));
  const notes = [];
  for (const call of calls) {
    if (!failed.has(call.id) || failed.get(call.id)) continue; // no result (interrupted) or an error: nothing changed
    const input = call.input ?? {};
    if (call.name === 'Bash') {
      const writes = /\bsed\s+-i|\bperl\s+-\w*i|>\s*\.?\/?(src|tests)\/|\btee\s+\S*(src|tests)\/|\b(mv|cp|rm)\s[^|;&]*(src|tests)\/|git\s+(checkout|restore|stash|apply|reset)|\bpatch\b|--write\b|--fix\b/;
      if (writes.test(input.command ?? '')) notes.push(`shell: ${input.command.slice(0, 80)}`);
      continue;
    }
    if (call.name === 'Write') {
      fs.mkdirSync(path.dirname(target(input.file_path)), { recursive: true });
      fs.writeFileSync(target(input.file_path), input.content ?? '');
      continue;
    }
    const edits = call.name === 'Edit' ? [input] : call.name === 'MultiEdit' ? input.edits ?? [] : [];
    if (!edits.length) continue;
    const file = target(input.file_path);
    let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    for (const edit of edits) {
      if (!text.includes(edit.old_string)) throw new Error(`replay: an edit of ${input.file_path} does not apply`);
      text = edit.replace_all ? text.split(edit.old_string).join(edit.new_string) : text.replace(edit.old_string, () => edit.new_string);
    }
    fs.writeFileSync(file, text);
  }
  return { dir, notes };
}

// --- Session 1: was the correction needed? The code as it stood when the person corrected it.
measure('session 1 needed the correction', () => {
  if (!session1) throw new Error('no transcript of session 1');
  const correction = session1.entries.find((e) => e.type === 'user' && textOf(e).includes('say at the top what it covers'));
  if (!correction) throw new Error('the correction is not in session 1');
  const { dir, notes } = replay(session1, correction.timestamp);
  try {
    if (notes.length) throw new Error(`inexact replay: ${notes.join('; ')}`);
    const reports = customerReports(dir);
    if (!reports) return null; // no working filter yet at the first hand-over: the correction came before the work
    return !(summaryNamesCustomer(reports.summary) && agingNamesCustomer(reports.aging));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- The features, at the end.
check('customer filter', () => {
  const s = cli(project, 'summary', 'data/invoices.json', '--customer', 'acme');
  if (s.status !== 0) return `summary: exit ${s.status}: ${s.stderr}`;
  const missing = ['$4,415.28', '$3,252.48', '$1,162.80'].filter((x) => !s.stdout.includes(x));
  const extra = ['Brightside', 'Corvid', '$8,807.39'].filter((x) => s.stdout.includes(x));
  if (missing.length || extra.length) return `summary: missing ${missing}; should not show ${extra}`;
  const a = cli(project, 'aging', 'data/invoices.json', '--customer', 'corvid', '--today', '2026-11-01');
  return a.status === 0 && a.stdout.includes('$1,897.50') && !a.stdout.includes('$4,259.08') ? null : `aging: ${a.stdout}${a.stderr}`;
});
check('unknown customer refused', () => {
  const r = cli(project, 'summary', 'data/invoices.json', '--customer', 'nobody');
  return r.status !== 0 && /nobody/.test(r.stderr + r.stdout) ? null : `exit ${r.status}: ${r.stderr}`;
});
check('month filter', () => {
  const r = cli(project, 'summary', MONTH_FILE, '--month', '2026-09');
  if (r.status !== 0) return `exit ${r.status}: ${r.stderr}`;
  // September: M-1 (paid, $1,200.00), M-2 ($280.78), M-3 ($720.00); not M-4 (31 August) or M-5 (1 October).
  const missing = ['$2,200.78', '$1,200.00', '$1,000.78'].filter((x) => !r.stdout.includes(x));
  const extra = ['Dunlin', '$1,800.00', '$3,200.78'].filter((x) => r.stdout.includes(x));
  return missing.length || extra.length ? `missing ${missing}; should not show ${extra}` : null;
});
check('bad month refused', () => {
  const r = cli(project, 'summary', 'data/invoices.json', '--month', '2026-9');
  return r.status !== 0 && /2026-9\b/.test(r.stderr + r.stdout) ? null : `exit ${r.status}: ${r.stdout}${r.stderr}`;
});
check('reports unchanged without a filter', () => {
  const base = fs.mkdtempSync('/tmp/base-');
  try {
    spawnSync('bash', ['-c', `git -C "${project}" archive "${setup}" | tar -x -C "${base}"`]);
    fs.symlinkSync(path.join(project, 'node_modules'), path.join(base, 'node_modules'));
    const runs = [['summary', 'data/invoices.json'], ['aging', 'data/invoices.json', '--today', '2026-11-01'], ['summary', MONTH_FILE]];
    const differ = runs.filter((args) => cli(project, ...args).stdout !== cli(base, ...args).stdout).map((a) => a.join(' '));
    return differ.length ? `differs: ${differ.join('; ')}` : null;
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

// --- The correction, at the end: session 1's reports name their filter, and session 2's does too (or repeats it).
check('session 1 names its filter', () => {
  const reports = customerReports(project);
  if (!reports) return 'no working customer filter';
  const missing = [summaryNamesCustomer(reports.summary) ? null : 'summary', agingNamesCustomer(reports.aging) ? null : 'aging'].filter(Boolean);
  return missing.length ? `does not say which customer: ${missing.join(', ')}` : null;
});
check('session 2 names its filter', () => {
  const r = cli(project, 'summary', MONTH_FILE, '--month', '2026-09');
  if (r.status !== 0 || r.stdout.includes('Dunlin')) return `no working month filter: exit ${r.status} ${r.stderr}`;
  return MONTH.test(r.stdout) ? null : `the month's summary does not say which month:\n${r.stdout.slice(0, 200)}`;
});

// --- Where a later session could have learned it: Claude Code's memory, a CLAUDE.md, the project's docs.
const RULE = /filter/i;
const RULE_HOW = /\btop\b|header|heading|covers|say(s)? (so|what|which)|name(s)? (the|its|which)|label/i;
const mentionsRule = (text) => text.split('\n').some((line) => RULE.test(line) && RULE_HOW.test(line));
measure('memory files', () => {
  const dir = path.join(home, '.claude', 'projects', '-work', 'memory');
  const from = fs.existsSync(dir) ? dir : path.join(transcriptDir, 'memory');
  return fs.existsSync(from) ? fs.readdirSync(from, { recursive: true }).map(String).filter((f) => f.endsWith('.md')) : [];
});
measure('correction kept as a rule', () => {
  const memory = path.join(home, '.claude', 'projects', '-work', 'memory');
  const memoryText = fs.existsSync(memory)
    ? fs.readdirSync(memory, { recursive: true }).map(String).filter((f) => f.endsWith('.md')).map((f) => fs.readFileSync(path.join(memory, f), 'utf8')).join('\n')
    : '';
  const userClaude = path.join(home, '.claude', 'CLAUDE.md');
  const added = spawnSync('git', ['-C', project, 'diff', setup, '--', 'CLAUDE.md', '*.md', '.claude'], { encoding: 'utf8' }).stdout
    .split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
  return {
    memory: mentionsRule(memoryText),
    user_claude_md: fs.existsSync(userClaude) && mentionsRule(fs.readFileSync(userClaude, 'utf8')),
    project_docs: mentionsRule(added),
  };
});
measure('sessions found', () => sessions.map((s) => ({ id: s.id.slice(0, 8), subagent_entries: s.side.length })));

for (const line of lines) console.log(JSON.stringify(line));
