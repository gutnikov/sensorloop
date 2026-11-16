#!/usr/bin/env node
// sensorloop: the gate of agent-calibration, from Claude Code hooks. Copied into the project as
// .sensorloop/hooks/calibration.mjs.
//
//   PreToolUse on Bash               before a `git commit`
//   PreToolUse on Edit|Write|...     before a write to .github/workflows/ (as the file would be after it), and before
//                                    any write to evals/scores/, which only a scoring script writes
//   Stop                             before the turn ends
//
// A workflow step that asks a model for a verdict (it names a model's key, or a reviewer, judge or LLM) and can fail
// the build (no continue-on-error, no `|| true`) blocks only with a score: a file in evals/scores/ whose `check` the
// step runs, scored on the expert's cases over at least three runs, with the share of her fails it fails and the share
// of her passes it passes each at or above the threshold she approved. Without one, it prints why to stderr and exits
// 2: the write or the commit is refused, or the turn goes on. The same failure three times in a row at the end of a
// turn hands the work to the person instead.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const LABEL = 'calibration';
const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const project = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const state = path.join(project, '.sensorloop', 'state');
const event = input.hook_event_name;
const tool = input.tool_name;
const args = input.tool_input ?? {};
const rel = (file) => path.relative(project, path.resolve(project, file ?? ''));

function refuse(message, problems) {
  if (event === 'Stop') {
    // The same failure three times in a row at the end of a turn: over to the person.
    fs.mkdirSync(state, { recursive: true });
    const streakFile = path.join(state, `${LABEL}.streak`);
    const key = createHash('sha256').update(problems.join('\n')).digest('hex').slice(0, 12);
    const [previous, count] = (fs.existsSync(streakFile) ? fs.readFileSync(streakFile, 'utf8') : '').trim().split(' ');
    const streak = previous === key ? Number(count) + 1 : 1;
    fs.writeFileSync(streakFile, `${key} ${streak}\n`);
    if (streak >= 3) {
      fs.rmSync(streakFile, { force: true });
      const handed = `sensorloop: ${LABEL} still refuses after 3 rounds (${problems.join('; ')}); over to you.`;
      process.stdout.write(`${JSON.stringify({ systemMessage: handed })}\n`);
      process.exit(0);
    }
  }
  process.stderr.write(`sensorloop: ${LABEL} failed. ${message}\n`);
  process.exit(2);
}
function pass() {
  if (event === 'Stop') fs.rmSync(path.join(state, `${LABEL}.streak`), { force: true });
  process.exit(0);
}

// --- Which calls this hook looks at.
const edits = ['Edit', 'Write', 'MultiEdit'].includes(tool);
const target = edits ? rel(args.file_path) : null;
if (event === 'PreToolUse' && edits && /^evals\/scores\//.test(target)) {
  refuse(`${target} holds a score measured by running the check: only the scoring script writes it, never a hand. ` +
    'Run the check on the expert\'s cases with the scoring script (LOOPS.md) and let it write the file.', [target]);
}
const WORKFLOWS = '.github/workflows';
if (event === 'PreToolUse' && edits && !(target.startsWith(`${WORKFLOWS}/`) && /\.ya?ml$/.test(target))) pass();
if (event === 'PreToolUse' && tool === 'Bash'
  && !/(^|[^\w-])git\s+(?:-\S+\s+(?:\S+\s+)?)*commit(\s|$)/.test(String(args.command ?? ''))) pass();
if (event === 'PreToolUse' && !edits && tool !== 'Bash') pass();

// --- The workflows, as they would be after this call.
const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');
function after(file) {
  const text = read(path.join(project, file));
  if (tool === 'Write') return String(args.content ?? '');
  const changes = tool === 'MultiEdit' ? args.edits ?? [] : [args];
  return changes.reduce((t, c) => (c.replace_all ? t.split(c.old_string).join(c.new_string) : t.replace(c.old_string, () => c.new_string)), text);
}
const dir = path.join(project, WORKFLOWS);
const workflows = new Map((fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter((f) => /\.ya?ml$/.test(f))
  .map((f) => [`${WORKFLOWS}/${f}`, read(path.join(dir, f))]));
if (edits) workflows.set(target, after(target));

const pkg = (() => {
  try {
    return JSON.parse(read(path.join(project, 'package.json')));
  } catch {
    return {};
  }
})();
/** A command, with the npm scripts it runs written out. */
const expand = (command, depth = 0) => command.replace(/npm run(?:\s+--silent)?\s+([\w:.-]+)/g, (all, name) =>
  (depth < 3 && pkg.scripts?.[name] ? `${all} [${expand(pkg.scripts[name], depth + 1)}]` : all));
/** The steps of a workflow: each list item under a `steps:` key, as text. */
function steps(text) {
  const rows = text.split('\n');
  const found = [];
  for (let i = 0; i < rows.length; i++) {
    if (!/^\s*steps:\s*$/.test(rows[i])) continue;
    const base = rows[i].search(/\S/);
    let current = null;
    for (let j = i + 1; j < rows.length; j++) {
      const indent = rows[j].search(/\S/);
      if (indent < 0) continue;
      if (indent <= base) break;
      if (/^\s*- /.test(rows[j]) && (current === null || indent === current.indent)) {
        current = { indent, text: rows[j] };
        found.push(current);
      } else if (current) current.text += `\n${rows[j]}`;
    }
  }
  return found.map((s) => s.text);
}
const MODEL = /\b(ANTHROPIC_\w+|OPENAI_\w+|DEEPSEEK\w*|GEMINI_\w+|MISTRAL_\w+|llm|judge|reviewer|review)\b/i;
const ADVICE = /continue-on-error:\s*true|\|\|\s*(true|:|exit 0)\b|;\s*exit 0\b|set \+e\b/;
const blocking = [...workflows].filter(([, text]) => /\b(pull_request|push)\b/.test(text)).flatMap(([file, text]) =>
  steps(text).map((step) => ({ file, step, run: expand(step) })).filter((s) => MODEL.test(s.run) && !ADVICE.test(s.run)));
if (!blocking.length) pass();

// --- The scores.
const scoresDir = path.join(project, 'evals', 'scores');
const rate = (v) => (typeof v === 'number' ? (v > 1 ? v / 100 : v) : NaN);
const scores = (fs.existsSync(scoresDir) ? fs.readdirSync(scoresDir) : []).filter((f) => f.endsWith('.json')).map((f) => {
  try {
    return { file: `evals/scores/${f}`, ...JSON.parse(read(path.join(scoresDir, f))) };
  } catch {
    return { file: `evals/scores/${f}`, broken: true };
  }
});
function verdict(score) {
  if (score.broken) return 'is not JSON';
  const wants = [];
  if (!(Number(score.runs) >= 3)) wants.push(`runs ${score.runs ?? '?'} (at least 3)`);
  if (!score.cases || !fs.existsSync(path.join(project, score.cases))) wants.push(`cases ${score.cases ?? '?'} (the expert's graded cases, a file in the repository)`);
  if (!score.model) wants.push('model (the one it was scored on)');
  for (const key of ['fails_caught', 'passes_passed']) {
    const got = rate(score[key]);
    const min = rate(score.threshold?.[key]);
    if (Number.isNaN(min)) wants.push(`threshold.${key} (the person's)`);
    else if (Number.isNaN(got)) wants.push(`${key}`);
    else if (got < min) wants.push(`${key} ${got} below its threshold ${min}`);
  }
  return wants.length ? `lacks or fails: ${wants.join(', ')}` : null;
}
const problems = [];
for (const s of blocking) {
  const name = (s.step.match(/name:\s*(.+)/)?.[1] ?? s.step.match(/run:\s*(.+)/)?.[1] ?? s.step).trim().slice(0, 80);
  const mine = scores.filter((sc) => typeof sc.check === 'string' && sc.check
    && new RegExp(`\\b${sc.check.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(s.run));
  if (!mine.length) {
    problems.push(`"${name}" (${s.file}): no score in evals/scores/ whose check it runs`);
    continue;
  }
  if (mine.some((sc) => !verdict(sc))) continue;
  problems.push(`"${name}" (${s.file}): ${mine.map((sc) => `${sc.file} ${verdict(sc)}`).join('; ')}`);
}
if (!problems.length) pass();

const lead = event === 'Stop' ? 'The workflows you leave have' : edits ? `This write to ${target} would leave` : 'This commit would leave';
refuse([
  `${lead} a step that asks a model and can fail the build, without a score at its threshold:`,
  ...problems.map((p) => `  ${p}`),
  'A model\'s check blocks only once it agrees with the expert. Run it on her graded cases at least three times, score',
  'the share of her fails it fails and of her passes it passes, each against the threshold she approved, and let the',
  'scoring script write evals/scores/<check>.json (LOOPS.md). Below the threshold, revise the prompt from the cases it',
  'gets wrong. Until it passes, the step runs as advice (continue-on-error: true) or not at all.',
].join('\n'), problems);
