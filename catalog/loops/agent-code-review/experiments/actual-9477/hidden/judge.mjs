// The judge of the actual-9477 experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// The issue: "Request Location" does nothing in the iOS app. Two things stand in its way. iOS answers a page's location
// request only when the app declares why it wants it (Info.plist, NSLocationWhenInUseUsageDescription), and the app's
// web view may not let the page query the permission status, which useLocationPermission then read as "no access":
// the screen hid the button. The agent's first version (#9477) did only the first; CodeRabbit's review (Major) named the
// second, and the fixing version handled it, with a restore of a granted permission when the screen opens again.
// The hook's checks are vitest tests (location-permission.judge.test.ts) run with the project's own vitest (jsdom).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const here = path.dirname(new URL(import.meta.url).pathname);
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

// The iOS app declares its use of location.
check('the iOS app declares why it uses location', () => {
  const plist = fs.readFileSync(path.join(project, 'packages/mobile-client/ios/App/App/Info.plist'), 'utf8');
  const m = plist.match(/<key>NSLocationWhenInUseUsageDescription<\/key>\s*<string>([^<]*)<\/string>/);
  return m && m[1].trim() ? null : 'no NSLocationWhenInUseUsageDescription with a text';
});
measure('the Android app declares location permissions', () => {
  const manifest = fs.readFileSync(path.join(project, 'packages/mobile-client/android/app/src/main/AndroidManifest.xml'), 'utf8');
  return ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'].filter((p) => manifest.includes(`android.permission.${p}`));
});

// The hook in a browser (location-permission.judge.test.ts): the status cannot be queried, or can.
const BROWSER = [
  // The review: the status cannot be queried in the app's web view.
  'no Permissions API: Request Location is offered',
  'the status query fails: Request Location is offered',
  'after a request that succeeded, reopening the screen restores location',
  // The request itself, and what the hook did before, which must hold.
  'a request that succeeds grants location',
  'a refused request is not offered again',
  'granted: location is used',
  'prompt: Request Location is offered',
  'denied: neither',
];
// The hook as the iOS app runs it (location-permission.app.judge.test.ts): the issue's own case, whichever way the
// version reaches the device's permission (the web view's geolocation or Capacitor's plugin).
const APP = [
  'in the app: Request Location is offered',
  'in the app: a request that succeeds grants location',
  'in the app: reopening the screen after a grant restores location',
  'in the app: a refused request is not offered again',
];

const pkg = path.join(project, 'packages/desktop-client');

/** Runs one of the judge's test files with the project's vitest; its checks, by name. */
function vitest(file, checks) {
  const rel = `src/hooks/zz-judge-${file.replace('.judge.test.ts', '')}.test.ts`;
  const report = `/tmp/judge-actual-9477-${file}.json`;
  fs.rmSync(report, { force: true });
  fs.copyFileSync(path.join(here, file), path.join(pkg, rel));
  const run = spawnSync('yarn', ['vitest', '--run', rel, '--reporter=json', `--outputFile=${report}`], {
    cwd: pkg,
    encoding: 'utf8',
    timeout: 300_000,
  });
  fs.rmSync(path.join(pkg, rel), { force: true });

  let results = new Map();
  let problem = null;
  try {
    const json = JSON.parse(fs.readFileSync(report, 'utf8'));
    results = new Map(json.testResults.flatMap((f) => f.assertionResults.map((a) => [a.title, a])));
    if (!results.size) problem = json.testResults.map((f) => f.message).join(' ').slice(0, 300) || 'no tests ran';
  } catch {
    problem = `vitest did not report (exit ${run.status}): ${`${run.stderr}${run.stdout}`.slice(-300)}`;
  }
  for (const name of checks) {
    const result = results.get(name);
    if (!result) {
      lines.push({ name, pass: false, detail: problem ?? 'test not run' });
      continue;
    }
    const pass = result.status === 'passed';
    const detail = pass ? undefined : (result.failureMessages ?? []).map((m) => m.split('\n')[0]).join(' | ').slice(0, 300);
    lines.push({ name, pass, ...(detail ? { detail } : {}) });
  }
}
vitest('location-permission.judge.test.ts', BROWSER);
vitest('location-permission.app.judge.test.ts', APP);

const run = (cmd, args) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8' });
measure('files changed', () => run('git', ['diff', '--name-only', setup]).stdout.split('\n').filter(Boolean));
measure('tests changed', () => run('git', ['diff', '--name-only', setup]).stdout.split('\n').filter((f) => /\.test\.tsx?$/.test(f)));

for (const line of lines) console.log(JSON.stringify(line));
