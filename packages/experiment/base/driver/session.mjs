// One session of an experiment, inside its container. Runs as root; the agent runs as `node` and cannot read
// /experiment (the task's other arm, the hidden checks).
//
// 1. Applies the arm's overlay to the project in one commit, and checks that it is the only difference.
// 2. Starts Claude Code in a tmux pane of fixed size, recorded by asciinema: the cast is the screen a person sees.
// 3. Pastes the task, waits for the agent to end its turn, and plays the person: runs the CI and, when it is red, says
//    so in the session, at most `person.max_reports` times.
// 4. Ends the session, then runs the hidden acceptance checks and writes everything to /out.
//
// Input: RUN_CONFIG (JSON, from the runner) and the credential variables from the runner's --env-file.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const config = JSON.parse(process.env.RUN_CONFIG ?? '{}');
const OUT = '/out';
const WORK = '/work';
const EXP = '/experiment';
const HOME = '/home/node';
const COLS = 90;
const ROWS = 34;
const started = Date.now();
let deadline = started + (config.person?.session_minutes ?? 45) * 60_000;

fs.mkdirSync(OUT, { recursive: true });
fs.chmodSync(OUT, 0o777);
const logFile = path.join(OUT, 'driver.log');
const events = [];
function log(event, data = {}) {
  const entry = { t: new Date().toISOString(), event, ...data };
  events.push(entry);
  fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- The credential: resolved into Claude Code's environment, and scrubbed from every output at the end.
const secrets = (config.credential_vars ?? []).map((name) => process.env[name]).filter((v) => v && v.length >= 8);
function resolve(value) {
  return String(value).replace(/\$\{(\w+)\}/g, (_, name) => {
    if (!(name in process.env)) throw new Error(`the credential file has no ${name}`);
    return process.env[name];
  });
}
const claudeEnv = Object.fromEntries(Object.entries(config.claude_env ?? {}).map(([k, v]) => [k, resolve(v)]));

// --- Running things as the agent's user, with a clean environment.
const baseEnv = {
  HOME,
  USER: 'node',
  PATH: '/usr/local/bin:/usr/bin:/bin',
  LANG: 'en_US.UTF-8',
  LC_ALL: 'en_US.UTF-8',
  TERM: 'xterm-256color',
  TZ: 'UTC',
  DISABLE_AUTOUPDATER: '1',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
};
function asNode(args, { env = {}, input, timeout = 600_000, cwd = WORK } = {}) {
  const pairs = Object.entries({ ...baseEnv, ...env }).map(([k, v]) => `${k}=${v}`);
  return spawnSync('runuser', ['-u', 'node', '--', 'env', '-i', ...pairs, ...args], {
    cwd,
    input,
    timeout,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}
function git(...args) {
  const run = asNode(['git', '-C', WORK, ...args]);
  if (run.status !== 0) throw new Error(`git ${args.join(' ')}: ${run.stderr}`);
  return run.stdout.trim();
}
const tmux = (...args) => asNode(['tmux', '-L', 'agent', ...args], { env: claudeEnv });
const pane = () => tmux('capture-pane', '-p', '-t', 'agent').stdout ?? '';

// --- 1. The arm's overlay, in one commit.
function listFiles(dir) {
  return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => path.relative(dir, path.join(d.parentPath ?? d.path, d.name)))
    .sort();
}
function applyOverlay() {
  const base = git('rev-parse', 'HEAD');
  const expected = [];
  if (config.overlay) {
    const dir = path.join(EXP, config.overlay);
    for (const rel of listFiles(dir)) {
      // The overlay's own README says what the arm adds; it is not part of the project.
      if (rel === 'README.md') continue;
      const append = rel.endsWith('.append');
      const target = path.join(WORK, append ? rel.slice(0, -'.append'.length) : rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const content = fs.readFileSync(path.join(dir, rel));
      if (append) fs.appendFileSync(target, content);
      else fs.writeFileSync(target, content);
      if (target.includes('/.sensorloop/hooks/')) fs.chmodSync(target, 0o755);
      expected.push(path.relative(WORK, target));
    }
    execFileSync('chown', ['-R', 'node:node', WORK]);
    git('add', '-A');
    const dated = config.overlay_date ? { GIT_AUTHOR_DATE: config.overlay_date, GIT_COMMITTER_DATE: config.overlay_date } : {};
    asNode(['git', '-C', WORK, '-c', 'user.name=Dana', '-c', 'user.email=dana@invoicer.invalid', 'commit', '-qm',
      `loops: ${config.loop}, wired by sensorloop`], { env: dated });
  }
  const setup = git('rev-parse', 'HEAD');
  const changed = setup === base ? [] : git('diff', '--name-only', base, setup).split('\n').filter(Boolean).sort();
  const want = [...new Set(expected)].sort();
  const ok = JSON.stringify(changed) === JSON.stringify(want);
  log('overlay', { arm: config.arm, base, setup, changed, ok });
  if (!ok) throw new Error(`the arm changes ${changed.join(', ')}, expected ${want.join(', ')}`);
  return { base, setup };
}

// --- 2. The session, recorded.
function claudePids() {
  // The pane runs asciinema; its descendants are Claude Code and whatever Claude Code runs (tools, hooks).
  const root = Number(tmux('display-message', '-p', '-t', 'agent', '#{pane_pid}').stdout.trim());
  const ps = spawnSync('ps', ['-e', '-o', 'pid=,ppid=,args='], { encoding: 'utf8' }).stdout.trim().split('\n');
  const procs = ps.map((line) => {
    const [, pid, ppid, args] = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/) ?? [];
    return { pid: Number(pid), ppid: Number(ppid), args };
  });
  const tree = new Set([root]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of procs) if (tree.has(p.ppid) && !tree.has(p.pid)) tree.add(p.pid), (grew = true);
  }
  return procs.filter((p) => tree.has(p.pid) && p.pid !== root);
}
function busyChildren() {
  // Claude Code itself is `claude` (a node process); anything below it is work in progress.
  const procs = claudePids();
  // Claude Code's own process: `claude ...` or `node .../claude ...`, not the shell or the recorder that start it.
  const claude = procs.find((p) => /^(\S*\/)?claude(\s|$)/.test(p.args) || /^node\s+\S*\/claude(\s|$)/.test(p.args));
  if (!claude) return [];
  const below = new Set([claude.pid]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of procs) if (below.has(p.ppid) && !below.has(p.pid)) below.add(p.pid), (grew = true);
  }
  return procs.filter((p) => below.has(p.pid) && p.pid !== claude.pid);
}
function transcriptMtime() {
  const dir = path.join(HOME, '.claude', 'projects');
  if (!fs.existsSync(dir)) return 0;
  let newest = 0;
  for (const rel of fs.readdirSync(dir, { recursive: true })) {
    const file = path.join(dir, String(rel));
    if (file.endsWith('.jsonl')) newest = Math.max(newest, fs.statSync(file).mtimeMs);
  }
  return newest;
}
const sessionAlive = () => tmux('has-session', '-t', 'agent').status === 0;

/**
 * Whether the agent ended its turn to wait for a background agent (Claude Code's turn_duration entry counts them): it
 * goes on by itself when that agent returns, so its turn is not over. The main transcripts only, not subagents' files.
 */
function waitingOnBackground() {
  const dir = path.join(HOME, '.claude', 'projects');
  if (!fs.existsSync(dir)) return false;
  let last = null;
  for (const rel of fs.readdirSync(dir, { recursive: true })) {
    const file = path.join(dir, String(rel));
    if (!file.endsWith('.jsonl') || file.includes(`${path.sep}subagents${path.sep}`)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.includes('"turn_duration"')) continue;
      try {
        const e = JSON.parse(line);
        if (e.subtype === 'turn_duration' && (!last || String(e.timestamp) > String(last.timestamp))) last = e;
      } catch {
        // a line still being written
      }
    }
  }
  return (last?.pendingBackgroundAgentCount ?? 0) > 0;
}

async function startSession(index = 0) {
  const title = `${config.loop} · arm ${config.arm} · ${config.model}${index ? ` · session ${index + 1}` : ''}`;
  const cast = index ? `session-${index + 1}.cast` : 'session.cast';
  const claude = ['claude', '--dangerously-skip-permissions', '--disallowedTools', 'AskUserQuestion'].join(' ');
  const record = `asciinema rec -q --overwrite -t '${title}' -c '${claude}' ${OUT}/${cast}`;
  const run = tmux('new-session', '-d', '-s', 'agent', '-x', String(COLS), '-y', String(ROWS), '-c', WORK, record);
  if (run.status !== 0) throw new Error(`tmux: ${run.stderr}`);
  for (let i = 0; i < 60; i++) {
    await sleep(1000);
    if (/bypass permissions on/.test(pane()) && /❯/.test(pane())) {
      log('ready');
      await sleep(1500);
      return;
    }
  }
  throw new Error(`Claude Code did not reach its prompt:\n${pane()}`);
}

async function paste(text) {
  const file = '/tmp/paste.txt';
  fs.writeFileSync(file, text);
  fs.chmodSync(file, 0o644);
  tmux('load-buffer', '-b', 'paste', file);
  tmux('paste-buffer', '-p', '-d', '-b', 'paste', '-t', 'agent');
  await sleep(1200);
  tmux('send-keys', '-t', 'agent', 'Enter');
}

async function type(text) {
  // Typed, not pasted, so the message shows in the session as a person writes it.
  for (let i = 0; i < text.length; i += 12) {
    tmux('send-keys', '-t', 'agent', '-l', text.slice(i, i + 12));
    await sleep(30);
  }
  await sleep(600);
  tmux('send-keys', '-t', 'agent', 'Enter');
}

/** The tool calls the transcript has gained since the last read, as `<name> <input as JSON>`. */
const transcriptOffsets = new Map();
function newToolCalls() {
  const dir = path.join(HOME, '.claude', 'projects');
  if (!fs.existsSync(dir)) return [];
  const calls = [];
  for (const rel of fs.readdirSync(dir, { recursive: true })) {
    const file = path.join(dir, String(rel));
    if (!file.endsWith('.jsonl')) continue;
    const size = fs.statSync(file).size;
    const from = transcriptOffsets.get(file) ?? 0;
    if (size <= from) continue;
    const buffer = Buffer.alloc(size - from);
    const fd = fs.openSync(file, 'r');
    fs.readSync(fd, buffer, 0, buffer.length, from);
    fs.closeSync(fd);
    const end = buffer.lastIndexOf(10);
    if (end < 0) continue;
    transcriptOffsets.set(file, from + end + 1);
    for (const line of buffer.subarray(0, end).toString('utf8').split('\n')) {
      try {
        const entry = JSON.parse(line);
        if (entry.type !== 'assistant') continue;
        for (const block of entry.message?.content ?? []) {
          if (block.type === 'tool_use') calls.push(`${block.name} ${JSON.stringify(block.input)}`);
        }
      } catch {
        // a line still being written
      }
    }
  }
  return calls;
}

/**
 * Waits until the agent has ended its turn: no spinner, nothing running under it, the transcript quiet. Returns
 * 'permission' when Claude Code asks the person, and 'watch:<i>' when a tool call matches the person's watch i.
 */
async function waitForTurnEnd(since, person = config.person ?? {}, fired = new Set()) {
  let started = false;
  let calm = 0;
  while (Date.now() < deadline) {
    await sleep(2000);
    if (!sessionAlive()) return 'session-ended';
    const screen = pane();
    if (/Do you want to proceed\?/.test(screen) && /1\. Yes/.test(screen)) return 'permission';
    if (person.watch?.length) {
      for (const call of newToolCalls()) {
        const hit = person.watch.findIndex((w, i) => !fired.has(i) && new RegExp(w.match).test(call));
        if (hit >= 0) {
          fired.add(hit);
          log('watch', { match: person.watch[hit].match, call: call.slice(0, 300) });
          return `watch:${hit}`;
        }
      }
    }
    const spinning = /esc to interrupt/i.test(screen);
    const working = busyChildren().length > 0;
    const mtime = transcriptMtime();
    if (spinning || working || mtime > since) started = true;
    const quiet = Date.now() - mtime > 10_000;
    calm = started && !spinning && !working && quiet && !waitingOnBackground() ? calm + 1 : 0;
    if (calm >= 3) return 'done';
  }
  return 'timeout';
}

/** The command a permission dialog asks about: the line between its two dashed rules. */
function permissionCommand(screen) {
  const lines = screen.split('\n');
  const rules = lines.map((l, i) => (/^\s*╌{10,}/.test(l) ? i : -1)).filter((i) => i >= 0);
  if (rules.length >= 2) return lines.slice(rules[0] + 1, rules[1]).map((l) => l.trim()).filter(Boolean).join(' ');
  return null;
}

// --- 3. The person.
function runCi() {
  const steps = [];
  for (const command of config.ci) {
    const run = asNode(['bash', '-lc', command], { timeout: 300_000 });
    const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
    steps.push({ command, status: run.status, output });
    if (run.status !== 0) break;
  }
  const failed = steps.find((s) => s.status !== 0);
  return { green: !failed, failed: failed?.command ?? null, steps };
}

function report(ci) {
  const step = ci.steps.find((s) => s.status !== 0);
  const lines = step.output.split('\n').map((l) => l.trim()).filter((l) => /error|fail|✗|×/i.test(l) && !/^npm (error|ERR)/.test(l));
  const shown = lines.slice(0, 2).map((l) => (l.length > 160 ? `${l.slice(0, 157)}...` : l));
  const more = lines.length > 2 ? ` (and ${lines.length - 2} more lines like these)` : '';
  const detail = shown.length ? ` ${shown.join(' ')}${more}` : '';
  return `CI is red on your branch: \`${step.command}\` fails.${detail}`;
}

/**
 * Whether the agent changed the project's code since the setup commit (the folders in code_paths, `src` by default),
 * without touching git's index while the session runs.
 */
function srcChanged(setup) {
  const paths = config.code_paths?.length ? config.code_paths : ['src'];
  const changed = asNode(['git', '-C', WORK, 'diff', '--name-only', setup, '--', ...paths]).stdout.trim();
  const added = asNode(['git', '-C', WORK, 'ls-files', '--others', '--exclude-standard', '--', ...paths]).stdout.trim();
  return Boolean(changed || added);
}

async function endSession() {
  if (sessionAlive()) {
    await type('/exit');
    for (let i = 0; i < 20 && sessionAlive(); i++) await sleep(1000);
  }
  if (sessionAlive()) {
    log('kill-session');
    tmux('kill-session', '-t', 'agent');
    await sleep(2000);
  }
}

// --- The first hand-over: what the person receives before anyone has said anything about it.
const SNAPSHOTS = '/snapshots';

/** Keeps the project's files as they are at the agent's first "done" (git's view: tracked and new, not ignored). */
function snapshotFirst(setup) {
  fs.mkdirSync(SNAPSHOTS, { recursive: true, mode: 0o700 });
  const list = asNode(['git', '-C', WORK, 'ls-files', '-c', '-o', '--exclude-standard', '-z']).stdout;
  const deleted = asNode(['git', '-C', WORK, 'ls-files', '-d', '-z']).stdout;
  fs.writeFileSync(path.join(SNAPSHOTS, 'first.files'), list);
  fs.writeFileSync(path.join(SNAPSHOTS, 'first.deleted'), deleted);
  const tar = spawnSync('tar', ['-C', WORK, '--null', '-T', path.join(SNAPSHOTS, 'first.files'), '--ignore-failed-read', '-cf',
    path.join(SNAPSHOTS, 'first.tar')], { encoding: 'utf8' });
  const head = asNode(['git', '-C', WORK, 'rev-parse', 'HEAD']).stdout.trim();
  log('first-handover', { files: list.split('\0').filter(Boolean).length, head, tar: tar.status });
  return { at: new Date().toISOString(), head, later_dones: 0, saved: tar.status === 0 };
}

/**
 * The project as it was at the first hand-over, in /tmp/first: a copy of the final project (so its dependencies are
 * there), with its files set back to the snapshot. Commits made after the first "done" stay in its history.
 */
function restoreFirst(setup) {
  const first = '/tmp/first';
  fs.rmSync(first, { recursive: true, force: true });
  execFileSync('cp', ['-a', WORK, first]);
  const inFirst = (...args) => asNode(['git', '-C', first, ...args], { cwd: '/tmp' });
  // The index as it was at setup: collect() marked every new file of the final project as tracked (`add -N`), and a
  // tracked file survives `clean`, so a file written after the first hand-over would stay in it.
  inFirst('read-tree', setup);
  inFirst('checkout', '-q', '-f', setup, '--', '.');
  inFirst('clean', '-q', '-fd');
  for (const file of fs.readFileSync(path.join(SNAPSHOTS, 'first.deleted'), 'utf8').split('\0').filter(Boolean)) {
    fs.rmSync(path.join(first, file), { force: true });
  }
  execFileSync('tar', ['-C', first, '-xf', path.join(SNAPSHOTS, 'first.tar')]);
  execFileSync('chown', ['-R', 'node:node', first]);
  inFirst('add', '-A', '-N', '.');
  return first;
}

// --- 4. After the session.
/** Copies into /out as plain readable files: /out is a folder of the host, where the agent's private modes get in the way. */
function copyOut(from, to) {
  const run = spawnSync('cp', ['-r', '--no-preserve=mode,ownership', from, to], { encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`cp ${from}: ${run.stderr}`);
}

function collect(setup) {
  const projects = path.join(HOME, '.claude', 'projects');
  try {
    if (fs.existsSync(projects)) copyOut(projects, path.join(OUT, 'transcript'));
  } catch (error) {
    log('error', { error: `transcript: ${error.message}` });
  }
  asNode(['git', '-C', WORK, 'add', '-A', '-N', '.']);
  fs.writeFileSync(path.join(OUT, 'diff.patch'), asNode(['git', '-C', WORK, 'diff', setup]).stdout);
  fs.writeFileSync(path.join(OUT, 'commits.txt'), asNode(['git', '-C', WORK, 'log', '--oneline', `${setup}..HEAD`]).stdout);

  const hidden = '/tmp/hidden';
  const judge = (project, outFile) => {
    const run = asNode(['node', path.join(hidden, path.basename(config.acceptance)), project, OUT], {
      timeout: (config.judge_minutes ?? 10) * 60_000,
      cwd: '/tmp',
      env: { SETUP_COMMIT: setup, BASE_COMMIT: config.base_commit ?? '', ...(config.judge_gets_model ? claudeEnv : {}) },
    });
    fs.writeFileSync(path.join(OUT, outFile), run.stdout ?? '');
    if (run.stderr) fs.writeFileSync(path.join(OUT, outFile.replace('.jsonl', '.stderr.txt')), run.stderr);
    return summarize(run.stdout ?? '');
  };
  fs.rmSync(hidden, { recursive: true, force: true });
  fs.cpSync(path.join(EXP, path.dirname(config.acceptance)), hidden, { recursive: true });
  execFileSync('chown', ['-R', 'node:node', hidden]);
  const final = judge(WORK, 'acceptance.jsonl');
  return final;
}

/** Checks (pass or fail) and measures (values) from a judge's output lines. */
function summarize(stdout) {
  const lines = stdout.split('\n').filter(Boolean).map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return {};
    }
  });
  const checks = lines.filter((c) => typeof c.pass === 'boolean');
  const values = Object.fromEntries(lines.filter((c) => 'value' in c).map((c) => [c.name, c.value]));
  return {
    pass: checks.length > 0 && checks.every((c) => c.pass),
    passed: checks.filter((c) => c.pass).length,
    total: checks.length,
    checks: Object.fromEntries(checks.map((c) => [c.name, c.pass])),
    failed: checks.filter((c) => !c.pass).map((c) => ({ name: c.name, detail: c.detail ?? null })),
    values,
  };
}

/** The judge on the first hand-over, when the work changed after it; otherwise the final verdict is the first one. */
function judgeFirst(result) {
  const first = result.first_handover;
  if (!first?.saved) return null;
  // Kept with the run, so a judge that changes later can grade the first hand-over again.
  fs.mkdirSync(path.join(OUT, 'first-handover'), { recursive: true });
  for (const file of ['first.tar', 'first.deleted', 'first.files']) {
    fs.copyFileSync(path.join(SNAPSHOTS, file), path.join(OUT, 'first-handover', file));
  }
  if (first.later_dones === 0) return { ...result.acceptance, same_as_final: true };
  const project = restoreFirst(result.setup);
  const hidden = '/tmp/hidden';
  const run = asNode(['node', path.join(hidden, path.basename(config.acceptance)), project, OUT], {
    timeout: (config.judge_minutes ?? 10) * 60_000,
    cwd: '/tmp',
    env: { SETUP_COMMIT: result.setup, BASE_COMMIT: config.base_commit ?? '', ...(config.judge_gets_model ? claudeEnv : {}) },
  });
  fs.writeFileSync(path.join(OUT, 'acceptance-first.jsonl'), run.stdout ?? '');
  return { ...summarize(run.stdout ?? ''), same_as_final: false };
}

function scrub() {
  if (!secrets.length) return;
  for (const rel of fs.readdirSync(OUT, { recursive: true })) {
    const file = path.join(OUT, String(rel));
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
    let text = fs.readFileSync(file, 'utf8');
    let hit = false;
    for (const secret of secrets) if (text.includes(secret)) (text = text.split(secret).join('[REDACTED]')), (hit = true);
    if (hit) fs.writeFileSync(file, text);
  }
}

/**
 * Hosts the session cannot reach (blocked_hosts in experiment.yaml), for an experiment whose network matters: they
 * resolve to an address nothing listens on. The model's API is never among them.
 */
function blockHosts() {
  const hosts = config.blocked_hosts ?? [];
  if (!hosts.length) return;
  const model = (() => {
    try {
      return new URL(claudeEnv.ANTHROPIC_BASE_URL).hostname;
    } catch {
      return null;
    }
  })();
  const lines = hosts.filter((h) => h !== model).map((h) => `0.0.0.0 ${h}`);
  fs.appendFileSync('/etc/hosts', `\n# blocked for this experiment\n${lines.join('\n')}\n`);
  log('blocked-hosts', { hosts: hosts.filter((h) => h !== model) });
}

/**
 * One session: Claude Code started fresh in the same project, the task pasted, and the person's part until the run
 * ends. Several sessions run one after another (`sessions` in experiment.yaml), each with its own task and person.
 */
async function runSession(index, taskFile, person, result) {
  deadline = Date.now() + (person.session_minutes ?? 45) * 60_000;
  await startSession(index);
  newToolCalls(); // the watch looks only at what this session does
  const task = fs.readFileSync(path.join(EXP, taskFile), 'utf8').trim();
  let since = transcriptMtime();
  await paste(task);
  log('task', { session: index + 1 });
  if (index === 0) result.task_at = new Date().toISOString();

  const maxReports = person.max_reports ?? 3;
  // What the person says after the agent's turns, in order, whatever the turn held: an answer if the agent asked, a
  // correction if it guessed, a reviewer's comment (person.first_reply, then person.replies).
  const replies = [person.first_reply, ...(person.replies ?? [])].filter(Boolean);
  let replied = 0;
  let reports = 0;
  let nudges = 0;
  const fired = new Set();
  let ended = null;
  for (;;) {
    const end = await waitForTurnEnd(since, person, fired);
    if (end === 'permission') {
      const command = permissionCommand(pane());
      const answer = person.permission ?? { answer: 'yes' };
      result.permission_asks.push({ at: new Date().toISOString(), session: index + 1, command, answer: answer.answer });
      log('permission', { command, answer: answer.answer });
      since = transcriptMtime();
      tmux('send-keys', '-t', 'agent', answer.answer === 'no' ? '2' : '1');
      if (answer.answer === 'no' && answer.message) {
        await sleep(3000);
        log('person', { message: answer.message });
        await type(answer.message);
      }
      continue;
    }
    if (end.startsWith('watch:')) {
      // The person watching stops the agent and says why (person.watch).
      const watch = person.watch[Number(end.slice('watch:'.length))];
      result.interrupts.push({ at: new Date().toISOString(), session: index + 1, match: watch.match });
      tmux('send-keys', '-t', 'agent', 'Escape');
      await sleep(2500);
      since = transcriptMtime();
      log('person', { message: watch.message });
      await type(watch.message);
      continue;
    }
    log('turn-end', { how: end, session: index + 1 });
    if (end !== 'done') {
      ended = end;
      break;
    }
    // The first hand-over is the first "done" with a change to the code; a turn that ends with a question is not one.
    if (result.first_handover) result.first_handover.later_dones += 1;
    else if (srcChanged(result.setup)) result.first_handover = snapshotFirst(result.setup);
    const round = { at: new Date().toISOString(), session: index + 1 };
    if (replied < replies.length) {
      const changed = srcChanged(result.setup);
      if (replied === 0 && person.first_reply && index === 0) {
        result.first_reply = { at: round.at, agent_had_changed_code: changed };
        log('first-reply', { agent_had_changed_code: changed });
      } else {
        log('reply', { session: index + 1, index: replied, agent_had_changed_code: changed });
      }
      log('person', { message: replies[replied] });
      replied += 1;
      since = transcriptMtime();
      await type(replies[replied - 1]);
      continue;
    }
    const ci = runCi();
    round.ci = { green: ci.green, failed: ci.failed };
    fs.writeFileSync(path.join(OUT, `ci-${result.rounds.length}.txt`),
      ci.steps.map((step) => `$ ${step.command}  (exit ${step.status})\n${step.output}`).join('\n'));
    result.rounds.push(round);
    log('ci', round.ci);
    if (ci.green && srcChanged(result.setup)) {
      ended = 'green';
      break;
    }
    if (reports + nudges >= maxReports) {
      ended = 'gave-up';
      break;
    }
    since = transcriptMtime();
    if (!srcChanged(result.setup)) {
      nudges += 1;
      round.person = 'Please go ahead and implement it.';
    } else {
      reports += 1;
      round.person = report(ci);
    }
    log('person', { message: round.person });
    await type(round.person);
  }
  result.reports += reports;
  result.nudges += nudges;
  await endSession();
  return ended;
}

async function main() {
  const result = {
    loop: config.loop, arm: config.arm, model: config.model, run: config.run_id,
    rounds: [], reports: 0, nudges: 0, permission_asks: [], interrupts: [], sessions: [],
  };
  result.claude_code = execFileSync('claude', ['--version'], { encoding: 'utf8' }).trim();
  result.image = config.image ?? null;
  result.plugin_commit = config.plugin_commit ?? null;
  try {
    blockHosts();
    const { base, setup } = applyOverlay();
    result.setup = setup;
    config.base_commit = base;
    const sessions = config.sessions?.length ? config.sessions : [{ task: config.task }];
    for (const [index, session] of sessions.entries()) {
      const person = { ...(config.person ?? {}), ...(session.person ?? {}) };
      const ended = await runSession(index, session.task, person, result);
      result.sessions.push({ task: session.task, ended });
      result.ended = ended;
      if (ended === 'session-ended' && index < sessions.length - 1) log('session-ended-early', { session: index + 1 });
    }
  } catch (error) {
    result.error = String(error?.stack ?? error);
    log('error', { error: result.error });
  } finally {
    await endSession();
    result.finished_at = new Date().toISOString();
    result.minutes = Math.round((Date.now() - started) / 600) / 100;
    if (result.setup) {
      try {
        result.acceptance = collect(result.setup);
        result.acceptance_first = judgeFirst(result);
      } catch (error) {
        result.acceptance_error = String(error?.stack ?? error);
      }
    }
    fs.writeFileSync(path.join(OUT, 'run.json'), `${JSON.stringify(result, null, 2)}\n`);
    log('finished', { ended: result.ended });
    scrub();
    spawnSync('chmod', ['-R', 'a+rwX', OUT]);
  }
}

await main();
