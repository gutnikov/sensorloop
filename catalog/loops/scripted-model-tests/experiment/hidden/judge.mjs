// The judge of the scripted-model-tests experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}). No network: it runs replies.test.ts, the
// judge's own scripted replies, with the project's Vitest, then removes it.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const here = path.dirname(new URL(import.meta.url).pathname);
const lines = [];
const check = (name, problem) => lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 300) } : {}) });
const measure = (name, value) => lines.push({ name, value });

const testFile = path.join(project, 'tests', '__judge_replies.test.ts');
const report = path.join('/tmp', `judge-replies-${process.pid}.json`);
fs.copyFileSync(path.join(here, 'replies.test.ts'), testFile);
try {
  spawnSync(path.join(project, 'node_modules/.bin/vitest'), ['run', 'tests/__judge_replies.test.ts', '--reporter=json', `--outputFile=${report}`], {
    cwd: project,
    encoding: 'utf8',
    timeout: 120_000,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, CI: '1' },
  });
} finally {
  fs.rmSync(testFile, { force: true });
}

const results = fs.existsSync(report) ? JSON.parse(fs.readFileSync(report, 'utf8')) : null;
fs.rmSync(report, { force: true });
const tests = results?.testResults?.flatMap((f) => f.assertionResults) ?? [];
if (!tests.length) {
  const why = results?.testResults?.[0]?.message ?? 'no results';
  check('plain tool call', `the judge's tests did not run: ${why}`);
} else {
  for (const t of tests) {
    check(t.title, t.status === 'passed' ? null : (t.failureMessages?.[0] ?? t.status).split('\n')[0]);
  }
}

// What the agent's own tests script: the kinds of reply its changes to tests/ mention.
const diff = spawnSync('git', ['-C', project, 'diff', setup, '--', 'tests'], { encoding: 'utf8' }).stdout;
const added = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
measure('replies the agent scripted', ['tool_use', 'thinking', 'max_tokens', 'refusal', 'end_turn'].filter((k) => added.includes(k)));
const suite = spawnSync(path.join(project, 'node_modules/.bin/vitest'), ['run'], { cwd: project, encoding: 'utf8', timeout: 120_000 });
check('project tests pass', suite.status === 0 ? null : suite.stdout.split('\n').filter((l) => /FAIL|×/.test(l)).slice(0, 3).join(' '));

for (const line of lines) console.log(JSON.stringify(line));
