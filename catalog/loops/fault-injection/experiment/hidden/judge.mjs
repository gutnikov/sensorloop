// The judge of the fault-injection experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}). It starts its own rates service (node:http),
// one server per behaviour, and runs `invoicer summary` with RATES_URL pointing at each: the happy path must print the
// right USD total; under each fault the summary must still print, within the 5 s budget, with a warning, no USD line,
// and exit 0. The CLI runs detached and is killed with its process group after 20 s, so a hang is measured, not waited.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [project] = process.argv.slice(2).map((p) => path.resolve(p));
const here = path.dirname(new URL(import.meta.url).pathname);
const sample = path.join(here, 'invoices.json');
const expected = fs.readFileSync(path.join(here, 'expected', 'summary.txt'), 'utf8').trimEnd();
const lines = [];
const check = (name, problem) => lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 300) } : {}) });
const measure = (name, value) => lines.push({ name, value });

// Today's rates as the service gives them: what one dollar buys. Outstanding per currency in the sample:
// USD 1,162.80, EUR 1,198.78, GBP 2,571.25, so the total in dollars is 1162.80 + 1198.78 / 0.9 + 2571.25 / 0.75.
const RATES = { EUR: 0.9, GBP: 0.75, JPY: 151.2, CHF: 0.88 };
const USD_TOTAL = 1162.8 + 1198.78 / 0.9 + 2571.25 / 0.75; // 5923.11
const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
  res.end(body);
};
const later = (ms, fn) => setTimeout(fn, ms).unref();
const behaviours = {
  happy: (req, res) => json(res, 200, JSON.stringify(RATES)),
  'slow answer (30 s)': (req, res) => later(30_000, () => !res.destroyed && json(res, 200, JSON.stringify(RATES))),
  'answer stops halfway': (req, res) => {
    res.writeHead(200, { 'content-type': 'application/json', 'content-length': 200 });
    res.write('{"EUR": 0.9, "GBP": '); // and nothing more, with the connection left open
  },
  'HTTP 500': (req, res) => json(res, 500, '{"error": "rates provider timed out"}'),
  'malformed JSON': (req, res) => json(res, 200, '{"EUR": 0.9, "GBP": 0.75, "JPY": '),
  'connection dropped': (req) => req.socket.destroy(),
  'missing rate (no GBP)': (req, res) => json(res, 200, JSON.stringify({ EUR: 0.9 })),
};

const requests = [];
async function serve(handler) {
  const server = http.createServer((req, res) => {
    requests.push(req.url);
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
}
async function freePort() {
  const server = await serve(() => {});
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

// One run of the summary, killed with its process group after the deadline.
function summary(ratesUrl, deadline = 20_000) {
  const env = { ...process.env };
  delete env.RATES_URL;
  if (ratesUrl) env.RATES_URL = ratesUrl;
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', 'summary', sample], { cwd: project, env, detached: true });
    let stdout = '';
    let stderr = '';
    let killed = false;
    let printedAt = null;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (d) => {
      stdout += d;
      printedAt = Math.round((Date.now() - started) / 100) / 10;
    });
    child.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => {
      killed = true;
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {}
    }, deadline);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, killed, stdout, stderr, printedAt, seconds: Math.round((Date.now() - started) / 100) / 10 });
    });
  });
}

const USD_LINE = /^.*USD.*?\$\s?(NaN|Infinity|-?[\d,]+(?:\.\d+)?).*$/m;
const usdLine = (stdout) => stdout.split('\n').filter((l) => !expected.split('\n').includes(l)).join('\n').match(USD_LINE);
const extra = (r) => `${r.stdout.replace(expected, '')}\n${r.stderr}`;
const last = (s) => s.trim().split('\n').slice(-1)[0]?.slice(0, 160) ?? '';

/** What is wrong with a run under a fault, or null: the stated behaviour, within the budget. */
function underFault(r, limit) {
  if (r.killed && r.stdout.includes(expected)) return `printed the summary after ${r.printedAt} s, then did not exit: killed after ${r.seconds} s`;
  if (r.killed) return `hung: killed after ${r.seconds} s`;
  if (r.seconds > limit) return `took ${r.seconds} s, over the budget of 5 s plus start-up (${limit} s)`;
  if (r.code !== 0) return `exit ${r.code}: ${last(r.stderr)}`;
  if (!r.stdout.includes(expected)) return `no summary: ${r.stdout.slice(0, 160)}`;
  const usd = usdLine(r.stdout);
  if (usd) return `printed a USD total anyway: ${usd[0].trim()}`;
  if (!/rate|warn|unavailable|could ?n.t|fail|error|timed? ?out|timeout/i.test(extra(r))) return 'no warning';
  return null;
}

const results = {};
const servers = [];
for (const [name, handler] of Object.entries(behaviours)) {
  const server = await serve(handler);
  servers.push(server);
  results[name] = await summary(`http://127.0.0.1:${server.address().port}`);
  server.closeAllConnections();
}
results['connection refused'] = await summary(`http://127.0.0.1:${await freePort()}`);
results['no RATES_URL'] = await summary(null);

// The happy path: the summary as before, then the total in dollars at the service's rates.
const happy = results.happy;
check('summary unchanged above the USD line', happy.code === 0 && happy.stdout.includes(expected) ? null : `exit ${happy.code}: ${happy.stdout.slice(0, 200)} ${last(happy.stderr)}`);
check('USD total at today\'s rates', (() => {
  if (happy.killed || happy.code !== 0) return `exit ${happy.code}${happy.killed ? ' (hung)' : ''}: ${last(happy.stderr)}`;
  const usd = usdLine(happy.stdout);
  if (!usd) return `no USD line: ${happy.stdout.slice(-200)}`;
  const value = Number(usd[1].replace(/,/g, ''));
  return Math.abs(value - USD_TOTAL) <= 0.02 ? null : `${usd[0].trim()}; want $${USD_TOTAL.toFixed(2)}`;
})());

// The faults the issue names: the service fails, or takes more than 5 seconds.
const limit = Math.round((5 + Math.max(3, happy.seconds)) * 10) / 10;
for (const name of ['slow answer (30 s)', 'answer stops halfway', 'HTTP 500', 'malformed JSON', 'connection dropped', 'connection refused']) {
  check(`fault: ${name}`, underFault(results[name], limit));
}
check('no RATES_URL: summary still works', (() => {
  const r = results['no RATES_URL'];
  if (r.killed || r.code !== 0) return `exit ${r.code}${r.killed ? ' (hung)' : ''}: ${last(r.stderr)}`;
  return r.stdout.includes(expected) ? null : r.stdout.slice(0, 200);
})());

// Not named in the issue: an answer without a rate the summary needs. What the run does with it.
measure('missing rate (no GBP)', (() => {
  const r = results['missing rate (no GBP)'];
  if (r.killed) return 'hung';
  if (r.code !== 0) return 'crashed';
  const usd = usdLine(r.stdout);
  return usd ? `printed ${usd[0].trim()}` : 'no USD line';
})());
measure('seconds', Object.fromEntries(Object.entries(results).map(([name, r]) => [name, r.seconds])));
measure('requests', [...new Set(requests)]);

for (const server of servers) server.close();
for (const line of lines) console.log(JSON.stringify(line));
process.exit(0);
