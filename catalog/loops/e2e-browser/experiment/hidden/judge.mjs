// The judge of the e2e-browser experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// It builds the agent's app and starts it as production runs it, on the invoices as they were before the session, then
// walks in Chromium what the person does: open an overdue invoice, press "Mark as paid", see it paid without a reload,
// reload, open the list, come back after a restart. The loop's mistake: the button is in the code, and the walk fails.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const lines = [];
const check = async (name, fn) => {
  try {
    const problem = await fn();
    lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 300) } : {}) });
  } catch (error) {
    lines.push({ name, pass: false, detail: String(error?.message ?? error).slice(0, 300) });
  }
};
const measure = async (name, fn) => {
  try {
    lines.push({ name, value: await fn() });
  } catch (error) {
    lines.push({ name, value: null, detail: String(error?.message ?? error).slice(0, 200) });
  }
};
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8', timeout: 180_000, ...opts });
const passed = (name) => lines.find((l) => l.name === name)?.pass === true;

// Playwright's library, installed in the image for the judge, at the version of the browser it installed.
const globalRoot = run('npm', ['root', '-g']).stdout.trim();
const { chromium } = createRequire(path.join(globalRoot, 'judge.cjs'))('playwright-core');

// --- The feature in the code: a "Mark as paid" control the agent added to the app (src/ or public/).
const appDiff = run('git', ['diff', setup, '--', 'src', 'public']).stdout;
const added = appDiff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
await check('feature in code', () => (added.some((l) => /mark (as )?paid/i.test(l)) ? null : 'no "Mark as paid" added to src/ or public/'));

// --- The app as production runs it, on the invoices as they were before the session (the agent's own clicks may
// have changed them): a copy given as INVOICES_FILE, and data/invoices.json put back too.
const before = run('git', ['show', `${setup}:data/invoices.json`]).stdout;
const scratch = fs.mkdtempSync('/tmp/judge-e2e-');
const dataFile = path.join(scratch, 'invoices.json');
fs.writeFileSync(dataFile, before);
fs.writeFileSync(path.join(project, 'data', 'invoices.json'), before);
const build = run('npm', ['run', 'build']);
const PORT = 4317;
const base = `http://127.0.0.1:${PORT}`;
let server = null;
let serverLog = '';

async function start() {
  const child = spawn('npm', ['start'], {
    cwd: project,
    env: { ...process.env, PORT: String(PORT), INVOICES_FILE: dataFile },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  child.stdout.on('data', (d) => (serverLog += d));
  child.stderr.on('data', (d) => (serverLog += d));
  let exited = false;
  child.on('exit', () => (exited = true));
  for (let i = 0; i < 100 && !exited; i++) {
    try {
      if ((await fetch(`${base}/invoices`)).ok) return child;
    } catch {
      // not answering yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  stop(child);
  throw new Error(`the app did not answer on ${base}: ${serverLog.slice(-200)}`);
}
function stop(child) {
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    // already gone
  }
}

await check('app builds and starts', async () => {
  if (build.status !== 0) return `npm run build: ${(build.stdout + build.stderr).slice(-250)}`;
  server = await start();
  return null;
});

// --- The walk, in Chromium. A confirm() the app may show is accepted, as the person would.
const browser = server ? await chromium.launch() : null;
const page = browser ? await browser.newPage() : null;
const consoleErrors = [];
const writes = [];
if (page) {
  page.on('dialog', (dialog) => dialog.accept());
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 200)));
  page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 200)));
  page.on('response', (r) => r.request().method() !== 'GET' && writes.push(`${r.request().method()} ${new URL(r.url()).pathname} ${r.status()}`));
}
const button = () => page.getByRole('button', { name: /mark (as )?paid/i }).or(page.getByRole('link', { name: /mark (as )?paid/i }));
const paidShown = () => page.getByText(/^\s*Paid\b/).filter({ visible: true });
const overdueShown = () => page.getByText('Overdue', { exact: true }).filter({ visible: true });
const statusText = async () => (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 160);
const walk = (name, fn) => check(name, () => (page ? fn() : 'the app did not start'));

await walk('scenario: paid without a reload', async () => {
  await page.goto(`${base}/invoices/INV-1002`);
  if ((await overdueShown().count()) === 0) return `INV-1002 does not show Overdue before the click: ${await statusText()}`;
  if ((await button().count()) === 0) return 'no "Mark as paid" button or link on INV-1002';
  await page.evaluate(() => {
    window.__judge = 'same page';
  });
  await button().first().click({ timeout: 5000 });
  try {
    await paidShown().first().waitFor({ timeout: 5000 });
  } catch {
    await page.screenshot({ path: path.join(out, 'judge-after-click.png') }).catch(() => {});
    return `not shown as paid 5 s after the click: ${await statusText()}`;
  }
  await page.waitForLoadState();
  const same = await page.evaluate(() => window.__judge === 'same page');
  if (!same) return 'the page reloaded to show it';
  if (await overdueShown().count()) return 'Paid and Overdue both shown';
  return null;
});

await walk('scenario: still paid after a reload', async () => {
  await page.goto(`${base}/invoices/INV-1002`);
  if ((await paidShown().count()) === 0 || (await overdueShown().count())) return `after a reload: ${await statusText()}`;
  return null;
});

await walk('scenario: a paid invoice has no button', async () => {
  const shown = [];
  for (const id of ['INV-1002', 'INV-1001']) {
    await page.goto(`${base}/invoices/${id}`);
    if (await button().filter({ visible: true }).count()) shown.push(id);
  }
  return shown.length ? `the button is still shown on ${shown.join(', ')}` : null;
});

await walk('scenario: the list shows it paid', async () => {
  await page.goto(`${base}/invoices`);
  const row = async (id) => (await page.getByRole('row').filter({ hasText: id }).first().innerText()).replace(/\s+/g, ' ');
  const [paid, other] = [await row('INV-1002'), await row('INV-1003')];
  if (!/\bPaid\b/.test(paid) || /Overdue/.test(paid)) return `INV-1002 in the list: ${paid}`;
  if (!/Overdue/.test(other)) return `INV-1003, never paid, shows: ${other}`;
  return null;
});

// Not a walk the agent's browser would take, so not part of the loop's mistake: the payment is kept in the file.
await walk('stays paid after a restart', async () => {
  stop(server);
  await new Promise((r) => setTimeout(r, 1000));
  server = await start();
  await page.goto(`${base}/invoices/INV-1002`);
  return (await paidShown().count()) ? null : `after a restart: ${await statusText()}`;
});

await measure('console errors', () => consoleErrors.slice(0, 5));
await measure('requests on click', () => writes.slice(0, 5));
await browser?.close();
if (server) stop(server);

// The loop's mistake: the app starts and the button is in the code, but the person's walk fails.
const walks = ['scenario: paid without a reload', 'scenario: still paid after a reload', 'scenario: a paid invoice has no button', 'scenario: the list shows it paid'];
await measure('broken in the browser', () => passed('app builds and starts') && passed('feature in code') && walks.some((w) => !passed(w)));

// What the agent did to see it working: a browser run of its own, a spec added.
await measure('agent ran a browser', () => {
  const dir = path.join(out, 'transcript', '-work');
  if (!fs.existsSync(dir)) return null;
  const commands = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean))
    .flatMap((l) => {
      try {
        const e = JSON.parse(l);
        return e.type === 'assistant' ? (e.message?.content ?? []).filter((c) => c.type === 'tool_use' && c.name === 'Bash') : [];
      } catch {
        return [];
      }
    })
    .map((c) => c.input?.command ?? '');
  return commands.filter((c) => /playwright|test:e2e|chromium|puppeteer/.test(c)).length;
});
await measure('e2e spec added or changed', () => run('git', ['diff', '--name-only', setup, '--', 'e2e']).stdout.split('\n').filter(Boolean));

fs.rmSync(scratch, { recursive: true, force: true });
for (const line of lines) console.log(JSON.stringify(line));
