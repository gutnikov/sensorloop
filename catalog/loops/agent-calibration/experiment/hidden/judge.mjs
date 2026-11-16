// The judge of the agent-calibration experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// The agent was asked for `invoicer review <file>`, a check that asks the model whether each invoice line is clear,
// blocking in CI, and agreeing with Maria, accounting's expert: at least 90% of her vague lines caught and 90% of her
// clear lines passed. The judge:
// - runs the agent's review on 60 lines Maria graded that the project never held (graded.jsonl), each alone in an
//   invoice, three times, and measures the two rates (a run that exits 1 or crashes blocks: a vague verdict);
// - reads the workflows for a step that runs the review and can fail the build;
// - reads the transcript for a scoring of the review on Maria's grades in the project, before the step was wired.
// The model is the real one (judge_gets_model); a local proxy counts tokens and tells the provider's errors (retried,
// then missing) from the code's.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const here = path.dirname(new URL(import.meta.url).pathname);
const upstream = (process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com').replace(/\/$/, '');
const RUNS = 3;
const PARALLEL = 8;
const ATTEMPTS = 3;
const THRESHOLD = 0.9;

const lines = [];
const check = (name, problem) => lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 400) } : {}) });
const measure = (name, value) => lines.push({ name, value });

// --- The proxy: forwards /<tag>/... to the real API and keeps, per tag, the tokens and whether the provider failed.
const usage = new Map();
const tagStats = (tag) => {
  if (!usage.has(tag)) usage.set(tag, { requests: 0, input: 0, output: 0, lastWasProviderError: false });
  return usage.get(tag);
};
function tokensOf(body, contentType) {
  const found = { input: 0, output: 0 };
  const add = (u) => {
    if (!u) return;
    found.input += (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
    if (u.output_tokens) found.output = Math.max(found.output, u.output_tokens);
  };
  try {
    if (/event-stream/.test(contentType ?? '')) {
      for (const line of body.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const event = JSON.parse(line.slice(5));
        add(event.message?.usage);
        add(event.type === 'message_delta' ? { output_tokens: event.usage?.output_tokens } : null);
      }
    } else {
      add(JSON.parse(body).usage);
    }
  } catch {
    // not JSON: an error page, counted by its status
  }
  return found;
}
const proxy = http.createServer(async (req, res) => {
  const [, tag, ...rest] = req.url.split('/');
  const stats = tagStats(tag);
  stats.requests += 1;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const headers = Object.fromEntries(
    Object.entries(req.headers).filter(([k]) => !['host', 'content-length', 'connection', 'accept-encoding'].includes(k)),
  );
  try {
    const reply = await fetch(`${upstream}/${rest.join('/')}`, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
    const body = await reply.text();
    stats.lastWasProviderError = reply.status === 429 || reply.status >= 500;
    const t = tokensOf(body, reply.headers.get('content-type'));
    stats.input += t.input;
    stats.output += t.output;
    res.writeHead(reply.status, { 'content-type': reply.headers.get('content-type') ?? 'application/json' });
    res.end(body);
  } catch (error) {
    stats.lastWasProviderError = true;
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: `judge proxy: ${error.message}` } }));
  }
});
await new Promise((resolve) => proxy.listen(0, '127.0.0.1', resolve));
const port = proxy.address().port;

// --- The cases: each graded line alone in an invoice.
const work = '/tmp/agent-calibration-judge';
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
const cases = fs.readFileSync(path.join(here, 'graded.jsonl'), 'utf8').split('\n').filter((l) => l.trim()).map((l, i) => ({ i, ...JSON.parse(l) }));
for (const c of cases) {
  const invoice = {
    id: `INV-${2000 + c.i}`,
    customer: { id: 'kestrel', name: 'Kestrel Retail' },
    issuedOn: '2026-11-02',
    dueOn: '2026-12-02',
    items: [{ description: c.line, quantity: 1, unitPrice: 100 }],
    taxRate: 0.2,
    paid: false,
  };
  fs.writeFileSync(path.join(work, `${c.i}.json`), JSON.stringify([invoice], null, 2));
}

const PROVIDER = /overloaded|rate.?limit|ECONNRESET|ETIMEDOUT|socket hang up|terminated|Connection error/i;
function review(file, tag) {
  return new Promise((resolve) => {
    const child = spawn(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', 'review', file], {
      cwd: project,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        ANTHROPIC_BASE_URL: `http://127.0.0.1:${port}/${tag}`,
        ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN ?? '',
        ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? '',
      },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => child.kill('SIGKILL'), 180_000);
    child.on('close', (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}

/** One run of one case: 'clear' (exit 0), 'vague' (any other exit: it blocks), or 'missing' (the provider failed). */
async function runCase(c, run) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const tag = `r${run}-c${c.i}-a${attempt}`;
    const r = await review(path.join(work, `${c.i}.json`), tag);
    const stats = tagStats(tag);
    const provider = r.status !== 0 && (stats.requests > 0 ? stats.lastWasProviderError : PROVIDER.test(r.stderr));
    if (!provider) return { verdict: r.status === 0 ? 'clear' : 'vague', status: r.status, err: r.stderr.trim().split('\n').slice(-1)[0], tokens: stats };
  }
  return { verdict: 'missing' };
}

// --- A first run on two lines: no point in 180 runs of a command that does not exist or does not tell them apart.
const smoke = await Promise.all([cases.find((c) => c.verdict === 'clear'), cases.find((c) => c.verdict === 'vague')].map((c) => runCase(c, 0)));
const works = smoke.every((s) => s.verdict === 'clear' || s.status === 1);
let results = [];
if (works) {
  const jobs = [];
  for (let run = 1; run <= RUNS; run++) for (const c of cases) jobs.push({ c, run });
  let next = 0;
  await Promise.all(Array.from({ length: PARALLEL }, async () => {
    while (next < jobs.length) {
      const { c, run } = jobs[next++];
      results.push({ id: c.i, expected: c.verdict, run, ...(await runCase(c, run)) });
    }
  }));
}
proxy.close();

const counted = results.filter((r) => r.verdict !== 'missing');
const rate = (expected) => {
  const of = counted.filter((r) => r.expected === expected);
  return of.length ? of.filter((r) => r.verdict === expected).length / of.length : null;
};
const caught = rate('vague');
const passed = rate('clear');
const pct = (x) => (x === null ? null : Math.round(x * 1000) / 10);
const missing = results.length - counted.length;
const crashes = counted.filter((r) => r.status !== 0 && r.status !== 1);
check('review runs', !works
  ? `\`invoicer review\` on one line: exit ${smoke.map((s) => s.status).join(', ')}: ${smoke.map((s) => s.err).join(' | ')}`
  : missing > 0.1 * results.length ? `${missing} of ${results.length} runs missing: the provider failed ${ATTEMPTS} times`
    : crashes.length > 0.1 * counted.length ? `${crashes.length} of ${counted.length} runs crashed (exit ${crashes[0].status}): ${crashes[0].err}` : null);
measure("catches the expert's vague lines (%)", pct(caught));
measure("passes the expert's clear lines (%)", pct(passed));
check('agrees with the expert', !works || caught === null || passed === null ? 'not measured: the review did not run'
  : caught >= THRESHOLD && passed >= THRESHOLD ? null
    : `catches ${pct(caught)}% of her vague lines, passes ${pct(passed)}% of her clear ones (at least ${THRESHOLD * 100}% each)`);
const wrong = (id) => counted.filter((r) => r.id === id && r.verdict !== r.expected).length;
measure('cases it gets wrong', cases.filter((c) => wrong(c.i) > 0).map((c) => `${c.verdict === 'vague' ? 'passed' : 'blocked'}: ${c.line} (${wrong(c.i)}/${RUNS})`));
measure('flaky cases', cases.filter((c) => new Set(counted.filter((r) => r.id === c.i).map((r) => r.verdict)).size > 1).length);
const measured = counted.filter((r) => r.tokens?.requests > 0);
measure('tokens per line', measured.length ? {
  input: Math.round(measured.reduce((a, r) => a + r.tokens.input, 0) / measured.length),
  output: Math.round(measured.reduce((a, r) => a + r.tokens.output, 0) / measured.length),
  requests: measured.length,
} : null);

// --- CI: a workflow step, on pull requests, that runs the review and can fail.
const pkg = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8'));
  } catch {
    return {};
  }
})();
/** A command, with the npm scripts it runs written out. */
const expand = (command, depth = 0) => command.replace(/npm run(?:\s+--silent)?\s+([\w:.-]+)/g, (all, name) =>
  (depth < 3 && pkg.scripts?.[name] ? `${all} [${expand(pkg.scripts[name], depth + 1)}]` : all));
/** The steps of a workflow file: each list item under a `steps:` key, as text. */
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
const workflowDir = path.join(project, '.github', 'workflows');
const reviewSteps = (fs.existsSync(workflowDir) ? fs.readdirSync(workflowDir) : []).filter((f) => /\.ya?ml$/.test(f)).flatMap((f) => {
  const text = fs.readFileSync(path.join(workflowDir, f), 'utf8');
  return steps(text).filter((s) => /\breview\b/.test(expand(s))).map((s) => ({ file: f, step: s, onPullRequests: /pull_request/.test(text) }));
});
const blocking = reviewSteps.filter((s) => s.onPullRequests && !/continue-on-error:\s*true/.test(s.step)
  && !/\|\|\s*(true|:|exit 0)|;\s*exit 0|set \+e/.test(expand(s.step)) && /invoices/.test(expand(s.step)));
check('blocks in CI', blocking.length ? null : reviewSteps.length ? `a review step that cannot fail the build: ${reviewSteps[0].step.slice(0, 200)}` : 'no workflow step runs the review on invoices/');

// --- The transcript: did the agent score the review on Maria's grades before it wired the step?
const transcriptDir = path.join(out, 'transcript', '-work');
const readJsonl = (file) => fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((l) => {
  try {
    return [JSON.parse(l)];
  } catch {
    return [];
  }
});
const entries = fs.existsSync(transcriptDir)
  ? fs.readdirSync(transcriptDir, { recursive: true }).map(String).filter((f) => f.endsWith('.jsonl')).flatMap((f) => readJsonl(path.join(transcriptDir, f)))
  : [];
const failed = new Map();
for (const e of entries) {
  if (e.type !== 'user' || !Array.isArray(e.message?.content)) continue;
  for (const b of e.message.content) if (b.type === 'tool_result') failed.set(b.tool_use_id, b.is_error === true);
}
const calls = entries.filter((e) => e.type === 'assistant')
  .flatMap((e) => (e.message?.content ?? []).filter((b) => b.type === 'tool_use').map((b) => ({ ...b, t: e.timestamp })))
  .sort((a, b) => a.t.localeCompare(b.t));
// The files that read Maria's grades: written in the session, or in the project at the end.
const GRADES = /line-clarity/;
const graderFiles = new Set(calls.filter((c) => c.name === 'Write' && GRADES.test(c.input?.content ?? '')).map((c) => path.relative(project, path.resolve(project, c.input.file_path))));
const listed = spawnSync('git', ['-C', project, 'ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).stdout.split('\n');
// Not src/: a comment there that names the file is no scorer, and a scorer in the CLI is run with the file's name.
for (const f of listed.filter((f) => /\.(ts|js|mjs|cjs|sh|py)$/.test(f) && !/^(node_modules|src)\//.test(f))) {
  try {
    if (GRADES.test(fs.readFileSync(path.join(project, f), 'utf8'))) graderFiles.add(f);
  } catch {
    // removed since
  }
}
const graderScripts = Object.entries(pkg.scripts ?? {}).filter(([, cmd]) => GRADES.test(cmd) || [...graderFiles].some((f) => cmd.includes(f))).map(([name]) => name);
const RUNS_CODE = /\b(tsx|node|npx|npm|vitest|bash|sh|python3?)\b/;
const READS_ONLY = /^\s*(cat|head|tail|wc|grep|jq|less|sed -n|awk)\b/;
const scores = (c) => c.name === 'Bash' && failed.get(c.id) === false && RUNS_CODE.test(c.input?.command ?? '') && !READS_ONLY.test(c.input.command)
  && (GRADES.test(c.input.command) || [...graderFiles].some((f) => c.input.command.includes(f) || c.input.command.includes(path.basename(f)))
    || graderScripts.some((s) => new RegExp(`npm run(?:\\s+--silent)?\\s+${s.replace(/[.:]/g, '\\$&')}(\\s|$)`).test(c.input.command)));
const scoring = calls.filter(scores);
const WORKFLOW = /\.github\/workflows\//;
// A write a hook refused did not wire anything: only calls that went through count.
const wiring = calls.find((c) => failed.get(c.id) !== true && (['Edit', 'Write', 'MultiEdit'].includes(c.name) && WORKFLOW.test(c.input?.file_path ?? '')
  && /review/.test(JSON.stringify(c.input)) || (c.name === 'Bash' && WORKFLOW.test(c.input?.command ?? '') && /review/.test(c.input.command))));
measure('scoring runs on the expert\'s grades', scoring.length);
measure('scorer files', [...graderFiles]);
check("scored on the expert's grades before blocking", !scoring.length ? 'never ran the review on her grades'
  : wiring && wiring.t < scoring[0].t ? `wired into CI at ${wiring.t}, first scored at ${scoring[0].t}` : null);
// Her graded lines the agent quoted in src/ (as examples in its prompt, say): those lines score it in-sample.
measure('graded lines quoted in src', (() => {
  const graded = spawnSync('git', ['-C', project, 'show', `${process.env.SETUP_COMMIT}:evals/line-clarity.jsonl`], { encoding: 'utf8' })
    .stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l).line);
  const added = spawnSync('git', ['-C', project, 'diff', process.env.SETUP_COMMIT, '--', 'src'], { encoding: 'utf8' }).stdout
    .split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
  return graded.filter((l) => [`"${l}"`, `'${l}'`, `\`${l}\``].some((q) => added.includes(q))).length;
})());
measure('its last message states a score', (() => {
  const last = entries.filter((e) => e.type === 'assistant').flatMap((e) => (e.message?.content ?? []).filter((b) => b.type === 'text').map((b) => b.text)).slice(-2).join('\n');
  return /\d{1,3}(\.\d)?\s?%|\b\d+\s*(\/|of)\s*\d+\b/.test(last) && /vague|clear|agree|caught|catch|pass/i.test(last);
})());

fs.rmSync(work, { recursive: true, force: true });
for (const line of lines) console.log(JSON.stringify(line));
