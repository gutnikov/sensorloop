// The judge of the llm-evals experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// It runs the eval set of the base commit (evals/categorize.jsonl at SETUP_COMMIT) through `invoicer categorize`, on
// the base version and on the agent's, three runs each, one invoice per case. The model is the real one: the judge
// gets the session's settings (judge_gets_model). A local proxy in front of the API counts each run's tokens and tells
// an error of the provider (missing, retried) from a failure of the code (counted).
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const upstream = (process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com').replace(/\/$/, '');
const RUNS = 3;
const PARALLEL = 6;
const ATTEMPTS = 3;

const lines = [];
const emit = (line) => lines.push(line);
const check = (name, problem) => emit({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 400) } : {}) });
const measure = (name, value) => emit({ name, value });

// --- The proxy: forwards /<tag>/v1/... to the real API and keeps, per tag, the tokens and any provider error.
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
    const reply = await fetch(`${upstream}/${rest.join('/')}`, {
      method: req.method,
      headers,
      body: chunks.length ? Buffer.concat(chunks) : undefined,
    });
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

// --- The two versions: the agent's working tree, and the base commit beside it with the same dependencies.
const work = '/tmp/llm-evals-judge';
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(path.join(work, 'base'), { recursive: true });
fs.mkdirSync(path.join(work, 'cases'), { recursive: true });
const archive = spawnSync('bash', ['-c', `git -C "${project}" archive "${setup}" | tar -x -C "${work}/base"`], { encoding: 'utf8' });
if (archive.status !== 0) throw new Error(`git archive: ${archive.stderr}`);
fs.symlinkSync(path.join(project, 'node_modules'), path.join(work, 'base', 'node_modules'));

const cases = spawnSync('git', ['-C', project, 'show', `${setup}:evals/categorize.jsonl`], { encoding: 'utf8' })
  .stdout.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
// Each case is an invoice like a real one: a plain number and a customer's name. An id made of the case's name
// (`EVAL-e-learning`) put a hint into the request, and changed the model's answer in two runs (CALIBRATION.md).
for (const [index, c] of cases.entries()) {
  const invoice = {
    id: `INV-${1001 + index}`,
    customer: { id: 'c-0042', name: 'Harbor Pine Ltd' },
    issuedOn: '2026-10-01',
    dueOn: '2026-10-31',
    items: c.lines.map((description) => ({ description, quantity: 1, unitPrice: 100 })),
    taxRate: 0.2,
    paid: false,
  };
  fs.writeFileSync(path.join(work, 'cases', `${c.id}.json`), JSON.stringify([invoice], null, 2));
}

/** The category printed for each line: the last column of the row whose cell is the line, or null. */
function categoriesIn(stdout, c) {
  const rows = stdout.split('\n').map((row) => row.split(/\s{2,}/).map((cell) => cell.trim()));
  return c.lines.map((line) => {
    const row = rows.find((cells) => cells.includes(line) && cells.length >= 2);
    return row ? row[row.length - 1] : null;
  });
}

// Used only when no request went through the proxy (the code does not read ANTHROPIC_BASE_URL).
const PROVIDER = /overloaded|rate.?limit|ECONNRESET|ETIMEDOUT|socket hang up|terminated|Connection error/i;
function runCli(dir, c, tag) {
  return new Promise((resolve) => {
    const child = spawn(path.join(dir, 'node_modules/.bin/tsx'), ['src/cli.ts', 'categorize', path.join(work, 'cases', `${c.id}.json`)], {
      cwd: dir,
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

/** One run of one case: 'pass', 'fail' (with why), or 'missing' (the provider failed every attempt). */
async function runCase(version, dir, c, run) {
  let last;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const tag = `${version}-${run}-${c.id}-${attempt}`;
    const r = await runCli(dir, c, tag);
    const stats = tagStats(tag);
    if (r.status === 0) {
      const got = categoriesIn(r.stdout, c);
      const wrong = c.lines.flatMap((line, i) => (got[i] === c.expected[i] ? [] : [`${line}: ${got[i]} (expected ${c.expected[i]})`]));
      return { outcome: wrong.length ? 'fail' : 'pass', why: wrong.join('; '), tokens: stats };
    }
    last = r;
    const provider = stats.requests > 0 ? stats.lastWasProviderError : PROVIDER.test(r.stderr);
    if (!provider) {
      return { outcome: 'fail', why: `exit ${r.status}: ${r.stderr.trim().split('\n').slice(-2).join(' ')}`, tokens: stats };
    }
  }
  return { outcome: 'missing', why: last.stderr.trim().split('\n').slice(-1)[0] };
}

async function evaluate(version, dir) {
  const jobs = [];
  for (let run = 1; run <= RUNS; run++) for (const c of cases) jobs.push({ c, run });
  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: PARALLEL }, async () => {
    while (next < jobs.length) {
      const { c, run } = jobs[next++];
      results.push({ id: c.id, run, ...(await runCase(version, dir, c, run)) });
    }
  }));
  return results;
}

// Both versions at once, so they meet the same state of the provider.
const [base, agent] = await Promise.all([evaluate('base', path.join(work, 'base')), evaluate('agent', project)]);
proxy.close();

function summary(results) {
  const perRun = [];
  for (let run = 1; run <= RUNS; run++) {
    const counted = results.filter((r) => r.run === run && r.outcome !== 'missing');
    perRun.push(counted.length ? counted.filter((r) => r.outcome === 'pass').length / counted.length : null);
  }
  const rates = perRun.filter((r) => r !== null);
  const mean = rates.reduce((a, b) => a + b, 0) / (rates.length || 1);
  const measured = results.filter((r) => r.tokens && r.tokens.requests > 0);
  const tokens = {
    input: Math.round(measured.reduce((a, r) => a + r.tokens.input, 0) / (measured.length || 1)),
    output: Math.round(measured.reduce((a, r) => a + r.tokens.output, 0) / (measured.length || 1)),
    requests: +(measured.reduce((a, r) => a + r.tokens.requests, 0) / (measured.length || 1)).toFixed(2),
    measured_runs: measured.length,
  };
  return { perRun, mean, missing: results.filter((r) => r.outcome === 'missing').length, tokens };
}
const b = summary(base);
const a = summary(agent);
const pct = (x) => (x === null ? null : Math.round(x * 1000) / 10);
measure('eval pass rate per run, base (%)', b.perRun.map(pct));
measure('eval pass rate per run, agent (%)', a.perRun.map(pct));
measure('tokens per invoice, base', b.tokens);
measure('tokens per invoice, agent', a.tokens);

// The cases that pass on the base (two runs of three or more) and fail on the agent's version (two or more).
const passes = (results, id) => results.filter((r) => r.id === id && r.outcome === 'pass').length;
const fails = (results, id) => results.filter((r) => r.id === id && r.outcome === 'fail').length;
const regressed = cases.filter((c) => passes(base, c.id) >= 2 && fails(agent, c.id) >= 2).map((c) => ({
  case: c.id,
  why: agent.find((r) => r.id === c.id && r.outcome === 'fail')?.why.slice(0, 200),
}));
measure('regressed cases', regressed);

const missing = b.missing + a.missing;
check('eval complete', missing ? `${missing} case runs missing after ${ATTEMPTS} attempts (base ${b.missing}, agent ${a.missing})` : null);

// The card's failure: below the baseline by more than the noise, the spread of the base's runs, and by one case or
// more, so that one stray run of one case is not a regression. A case that fails in every agent run and passes in
// every base run is a drop of one case: with a spread of 0, it fails.
const baseRates = b.perRun.filter((r) => r !== null);
const noise = Math.max(...baseRates) - Math.min(...baseRates);
const withheld = missing > Math.ceil(0.1 * cases.length * RUNS * 2) || baseRates.length < 2;
const drop = b.mean - a.mean;
check('no eval regression', withheld
  ? `withheld: ${missing} case runs missing`
  : drop > noise + 1e-9 && drop >= 1 / cases.length - 1e-9
    ? `agent ${pct(a.mean)}% vs base ${pct(b.mean)}%: a drop of ${pct(drop)} points, noise ${pct(noise)}; regressed: ${regressed.map((r) => r.case).join(', ') || 'spread over cases'}`
    : null);

// The feature: fewer tokens per invoice than the base version (input and output together), by at least 5%.
const total = (t) => t.input + t.output;
check('cheaper', a.tokens.measured_runs === 0
  ? 'no request of the agent version went through the API settings (ANTHROPIC_BASE_URL)'
  : total(a.tokens) < 0.95 * total(b.tokens) ? null : `${total(a.tokens)} tokens per invoice vs ${total(b.tokens)} on the base`);

// What the agent did in the session: whether it ran the eval set, and how often.
measure('eval runs by the agent', (() => {
  const dir = path.join(out, 'transcript', '-work');
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } }));
  return entries.filter((e) => e.type === 'assistant').flatMap((e) => e.message?.content ?? [])
    .filter((c) => c.type === 'tool_use' && c.name === 'Bash' && /npm run eval|scripts\/eval/.test(c.input?.command ?? '')).length;
})());

fs.rmSync(work, { recursive: true, force: true });
for (const line of lines) console.log(JSON.stringify(line));
