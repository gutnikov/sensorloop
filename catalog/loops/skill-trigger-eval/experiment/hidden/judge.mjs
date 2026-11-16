// The judge of the skill-trigger-eval experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// It runs headless Claude Code (`claude -p`, stream-json) with the agent's plugin (--plugin-dir) on the requests in
// cases.json, RUNS times each, in a small app repository made here, and reads whether the agent's first action loads
// a skill of the plugin: a Skill tool call whose input is {"skill": "<plugin>:<skill>"}. A load after any other
// action, todo and planning tools aside, counts as none (the card's `late`). The model is the session's
// (judge_gets_model). Then the card's rule, per skill: each request that should load it does so in half its runs or
// more, and every other request in fewer than half.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const here = path.dirname(new URL(import.meta.url).pathname);
const RUNS = 2;
const PARALLEL = 4;
const ATTEMPTS = 2;
const PLANNING = new Set(['TodoWrite', 'TaskCreate', 'TaskUpdate', 'TaskList', 'TaskGet', 'ToolSearch', 'EnterPlanMode', 'ExitPlanMode']);

const lines = [];
const check = (name, problem) => lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 500) } : {}) });
const measure = (name, value) => lines.push({ name, value });

// --- The plugin as the agent left it: its name, and each skill's ids (folder and front matter name).
const manifest = path.join(project, '.claude-plugin', 'plugin.json');
if (!fs.existsSync(manifest)) {
  console.log(JSON.stringify({ name: 'changelog skill added', pass: false, detail: 'no .claude-plugin/plugin.json at the root any more' }));
  process.exit(0);
}
const plugin = JSON.parse(fs.readFileSync(manifest, 'utf8')).name;
function skillsIn(listing) {
  return listing.map((dir) => {
    const file = path.join(project, 'skills', dir, 'SKILL.md');
    const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    const name = text.match(/^---[\s\S]*?^name:\s*["']?([^"'\n]+?)["']?\s*$/m)?.[1];
    return { dir, ids: new Set([dir, name].filter(Boolean)), hasFile: Boolean(text) };
  });
}
const now = fs.existsSync(path.join(project, 'skills'))
  ? fs.readdirSync(path.join(project, 'skills'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];
const before = spawnSync('git', ['-C', project, 'ls-tree', '--name-only', `${setup}:skills`], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
const skills = skillsIn(now).filter((s) => s.hasFile);
const added = skills.filter((s) => !before.includes(s.dir));
const changelog = added.find((s) => [...s.ids].some((id) => /changelog/i.test(id))) ?? (added.length === 1 ? added[0] : null);
// The keys the cases use for the skills: release-notes, version-bump (the base's), changelog (the new one).
const byKey = new Map(skills.filter((s) => before.includes(s.dir)).map((s) => [s.dir, s]));
if (changelog) byKey.set('changelog', changelog);
measure('skills', { before, now: skills.map((s) => s.dir), changelog: changelog?.dir ?? null });

// --- An app repository to ask in, as the plugin's users do: a tag, commits since, a changelog.
const work = '/tmp/skill-trigger-judge';
fs.rmSync(work, { recursive: true, force: true });
const app = path.join(work, 'acme-web');
fs.mkdirSync(path.join(app, 'src'), { recursive: true });
const git = (...args) => spawnSync('git', ['-C', app, '-c', 'user.name=Sam', '-c', 'user.email=sam@acme.invalid', ...args], { encoding: 'utf8' });
const write = (rel, text) => fs.writeFileSync(path.join(app, rel), text);
git('init', '-q', '-b', 'main');
write('package.json', `${JSON.stringify({ name: 'acme-web', version: '2.3.1', private: true, scripts: { test: 'vitest run', build: 'vite build' } }, null, 2)}\n`);
write('CHANGELOG.md', '# Changelog\n\n## [Unreleased]\n\n## [2.3.1] - 2026-10-30\n\n### Fixed\n- Totals on the dashboard round to cents again.\n');
write('src/login.ts', 'export function login() {}\n');
git('add', '-A');
git('commit', '-qm', 'release: v2.3.1');
git('tag', '-a', 'v2.3.1', '-m', 'v2.3.1');
for (const [file, message] of [['src/export.ts', 'feat: export a report as CSV'], ['src/login.ts', 'fix: login no longer loops after a password change'], ['src/search.ts', 'perf: faster search on large accounts']]) {
  write(file, `// ${message}\nexport {};\n`);
  git('add', '-A');
  git('commit', '-qm', message);
}

// --- One headless run: the first action, and any load of a plugin skill.
const homes = Array.from({ length: PARALLEL }, (_, i) => {
  const home = path.join(work, `home-${i}`);
  fs.mkdirSync(home, { recursive: true });
  const seed = path.join(process.env.HOME ?? '/home/node', '.claude.json');
  if (fs.existsSync(seed)) fs.copyFileSync(seed, path.join(home, '.claude.json'));
  return home;
});
function claude(prompt, home) {
  return new Promise((resolve) => {
    const env = { ...process.env, HOME: home, DISABLE_AUTOUPDATER: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' };
    const child = spawn('claude', ['-p', prompt, '--plugin-dir', project, '--output-format', 'stream-json', '--verbose',
      '--max-turns', '2', '--allowedTools', 'Read', 'Glob', 'Grep', 'Skill'], { cwd: app, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => child.kill('SIGKILL'), 240_000);
    child.on('close', (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}
const tokens = { input: 0, cached: 0, output: 0 };
function readRun(stdout) {
  const events = stdout.split('\n').filter((l) => l.startsWith('{')).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const init = events.find((e) => e.type === 'system' && e.subtype === 'init');
  const calls = events.filter((e) => e.type === 'assistant' && e.parent_tool_use_id == null)
    .flatMap((e) => e.message?.content ?? []).filter((c) => c.type === 'tool_use');
  const actions = calls.filter((c) => !PLANNING.has(c.name));
  const loadOf = (c) => (c?.name === 'Skill' ? String(c.input?.skill ?? '') : null);
  const answered = events.some((e) => e.type === 'assistant');
  const usage = events.find((e) => e.type === 'result')?.usage ?? {};
  tokens.input += usage.input_tokens ?? 0;
  tokens.cached += (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
  tokens.output += usage.output_tokens ?? 0;
  return {
    listed: init?.skills ?? init?.slash_commands ?? [],
    first: loadOf(actions[0]),
    loads: actions.map(loadOf).filter(Boolean),
    firstTool: actions[0]?.name ?? null,
    answered,
  };
}
/** The key of the plugin skill a Skill input names (release-notes, version-bump, changelog), or null. */
function keyOf(skillInput) {
  if (!skillInput) return null;
  const [owner, id] = skillInput.includes(':') ? skillInput.split(':') : [plugin, skillInput];
  if (owner !== plugin) return null;
  for (const [key, s] of byKey) if (s.ids.has(id)) return key;
  return `other:${id}`;
}

// --- The requests, RUNS times each.
const cases = JSON.parse(fs.readFileSync(path.join(here, 'cases.json'), 'utf8'));
const jobs = cases.flatMap((c) => Array.from({ length: RUNS }, (_, run) => ({ c, run })));
const results = [];
let listedOnce = null;
let next = 0;
let claudeRuns = 0;
await Promise.all(homes.map(async (home) => {
  while (next < jobs.length) {
    const { c, run } = jobs[next++];
    let result = { id: c.id, run, missing: true };
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      claudeRuns += 1;
      const r = await claude(c.prompt, home);
      const seen = readRun(r.stdout);
      listedOnce ??= seen.answered ? seen.listed : null;
      if (!seen.answered) {
        result = { id: c.id, run, missing: true, why: (r.stderr || r.stdout).trim().split('\n').slice(-1)[0]?.slice(0, 200) };
        continue;
      }
      result = { id: c.id, run, missing: false, first: keyOf(seen.first), firstTool: seen.firstTool, late: seen.loads.map(keyOf).filter((k) => k && k !== keyOf(seen.first)) };
      break;
    }
    results.push(result);
  }
}));

// --- The rates, and the card's rule per skill.
const rate = (id, key) => {
  const runs = results.filter((r) => r.id === id && !r.missing);
  return runs.length ? runs.filter((r) => r.first === key).length / runs.length : null;
};
const table = cases.map((c) => {
  const runs = results.filter((r) => r.id === c.id && !r.missing);
  const loads = {};
  for (const r of runs) loads[r.first ?? (r.firstTool ? `no load (${r.firstTool})` : 'no load (no tool)')] = (loads[r.first ?? (r.firstTool ? `no load (${r.firstTool})` : 'no load (no tool)')] ?? 0) + 1;
  const late = [...new Set(runs.flatMap((r) => r.late))];
  return { id: c.id, expected: c.expected ?? 'none', runs: runs.length, loads, ...(late.length ? { late } : {}) };
});
measure('first action per request', table);
measure('claude runs', claudeRuns);
measure('model tokens', tokens);
const missing = results.filter((r) => r.missing);
check('runs complete', missing.length ? `${missing.length} runs with no answer: ${missing[0].why}` : null);

check('changelog skill added', !changelog
  ? `no new skill for changelog entries under skills/ (skills now: ${skills.map((s) => s.dir).join(', ')})`
  : listedOnce && !listedOnce.includes(`${plugin}:${changelog.dir}`) && ![...changelog.ids].some((id) => listedOnce.includes(`${plugin}:${id}`))
    ? `${changelog.dir} is not among the skills Claude Code lists: ${listedOnce.filter((s) => s.startsWith(plugin)).join(', ')}`
    : null);

for (const key of ['release-notes', 'version-bump', 'changelog']) {
  const problems = [];
  for (const c of cases) {
    const r = rate(c.id, key);
    if (r === null) continue;
    if (c.expected === key && r < 0.5) problems.push(`${c.id}: expected load, rate ${r}`);
    if (c.expected !== key && r >= 0.5) problems.push(`${c.id}: expected no load, rate ${r}`);
  }
  if (!byKey.has(key)) problems.unshift('no such skill');
  check(`triggers: ${key}`, problems.length ? problems.join('; ') : null);
}

const validate = spawnSync('claude', ['plugin', 'validate', project], { encoding: 'utf8', timeout: 60_000 });
check('plugin validates', validate.status === 0 ? null : (validate.stdout + validate.stderr).split('\n').filter((l) => /✘|error/i.test(l)).slice(0, 2).join(' '));

// The agent's trigger cases for the new skill, in evals/ (a measure: what the team would review).
const evalDiff = spawnSync('git', ['-C', project, 'diff', '--name-only', setup, '--', 'evals'], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
measure('trigger cases added', [...new Set(evalDiff.map((f) => f.split('/')[1]))]);

fs.rmSync(work, { recursive: true, force: true });
for (const line of lines) console.log(JSON.stringify(line));
