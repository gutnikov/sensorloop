// Runs a loop's experiment: builds its sandbox, runs sessions in fresh containers, and scores each run.
//
//   npm run experiment -- <loop-id> --arm A|B --model <name> [--runs N] [--parallel N] [--label name]
//
// Each run writes to catalog/loops/<id>/experiment/runs/<label>/<arm>-<model>-<n>/ (not committed: casts and
// transcripts are large and must be read before they are shared), and its score to runs/<label>/runs.jsonl.
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { score } from './score.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const baseDir = path.join(root, 'packages/experiment/base');
const pluginScripts = path.join(root, 'plugins/claude/skills/sensorloop/wiring/scripts');
const fixtures = path.join(root, 'packages/experiment/fixtures');

function options(argv) {
  const [loop, ...rest] = argv;
  const opts = { loop, runs: 1, parallel: 2 };
  for (let i = 0; i < rest.length; i += 2) opts[rest[i].replace(/^--/, '')] = rest[i + 1];
  if (!opts.loop || !opts.arm || !opts.model) {
    console.error('usage: npm run experiment -- <loop-id> [--name <experiment>] --arm A|B --model <name> [--runs N] [--parallel N] [--label name]');
    process.exit(2);
  }
  opts.runs = Number(opts.runs);
  opts.parallel = Number(opts.parallel);
  opts.label ??= new Date().toISOString().slice(0, 10);
  return opts;
}

/** A hash of the files under a folder, for an image tag that changes when they do. */
function hashDir(dir, skip = []) {
  const hash = createHash('sha256');
  const files = fs.readdirSync(dir, { recursive: true })
    .map(String)
    .filter((rel) => !skip.some((s) => rel === s || rel.startsWith(`${s}/`)))
    .filter((rel) => fs.statSync(path.join(dir, rel)).isFile())
    .sort();
  for (const rel of files) hash.update(rel).update('\0').update(fs.readFileSync(path.join(dir, rel)));
  return hash.digest('hex').slice(0, 12);
}

function docker(args, { quiet = false } = {}) {
  return execFileSync('docker', args, { encoding: 'utf8', stdio: quiet ? 'pipe' : ['ignore', 'pipe', 'inherit'] }).trim();
}

function imageExists(tag) {
  try {
    docker(['image', 'inspect', tag], { quiet: true });
    return true;
  } catch {
    return false;
  }
}

function build(loop, expDir, name) {
  const baseTag = `sensorloop-experiment-base:${hashDir(baseDir)}`;
  if (!imageExists(baseTag)) {
    console.log(`building ${baseTag}`);
    execFileSync('docker', ['build', '-t', baseTag, baseDir], { stdio: 'inherit' });
  }
  // The tag follows everything the image is built from: the experiment, the plugin's scripts, the shared projects.
  const inputs = createHash('sha256').update(hashDir(expDir, ['runs', 'results'])).update(hashDir(pluginScripts)).update(hashDir(fixtures)).digest('hex').slice(0, 12);
  const tag = `sensorloop-experiment-${loop}${name ? `-${name}` : ''}:${inputs}-${baseTag.split(':')[1]}`;
  if (!imageExists(tag)) {
    console.log(`building ${tag}`);
    execFileSync('docker', ['build', '--build-arg', `BASE=${baseTag}`, '--build-context', `plugin=${pluginScripts}`, '--build-context', `fixtures=${fixtures}`, '-t', tag, expDir], {
      stdio: 'inherit',
    });
  }
  return { tag, id: docker(['image', 'inspect', tag, '--format', '{{.Id}}'], { quiet: true }) };
}

function credentialFile(file) {
  const resolved = file.replace(/^~(?=\/)/, os.homedir());
  if (!fs.existsSync(resolved)) throw new Error(`no credential file at ${resolved}`);
  const names = fs.readFileSync(resolved, 'utf8').split('\n').map((l) => l.match(/^\s*([A-Z_][A-Z0-9_]*)=/)?.[1]).filter(Boolean);
  return { file: resolved, names };
}

function pluginCommit() {
  const commit = execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  const dirty = execFileSync('git', ['-C', root, 'status', '--porcelain', '--', 'plugins/claude'], { encoding: 'utf8' }).trim();
  return dirty ? `${commit}+changes` : commit;
}

function runOne({ image, config, cred, outDir }) {
  fs.mkdirSync(outDir, { recursive: true });
  const name = `sensorloop-${config.loop}-${config.run_id}`.replace(/[^a-zA-Z0-9_.-]/g, '-');
  const args = ['run', '--rm', '--name', name, '--cpus', '2', '--memory', '3g', '--env-file', cred.file,
    '-e', `RUN_CONFIG=${JSON.stringify(config)}`, '-v', `${outDir}:/out`, image.tag];
  return new Promise((resolve) => {
    const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const log = fs.createWriteStream(path.join(outDir, 'container.log'));
    child.stdout.pipe(log);
    child.stderr.pipe(log);
    child.on('close', (code) => resolve(code));
  });
}

async function main() {
  const opts = options(process.argv.slice(2));
  // A loop's experiment is catalog/loops/<id>/experiment/, or one of several in experiments/<name>/ (--name).
  const expDir = opts.name
    ? path.join(root, 'catalog/loops', opts.loop, 'experiments', opts.name)
    : path.join(root, 'catalog/loops', opts.loop, 'experiment');
  if (!fs.existsSync(path.join(expDir, 'experiment.yaml'))) throw new Error(`no experiment.yaml in ${path.relative(root, expDir)}`);
  const exp = parse(fs.readFileSync(path.join(expDir, 'experiment.yaml'), 'utf8'), { merge: true });
  const arm = exp.arms?.[opts.arm];
  const shared = parse(fs.readFileSync(path.join(root, 'packages/experiment/models.yaml'), 'utf8'), { merge: true });
  const model = { ...shared, ...exp.models }[opts.model];
  if (!arm) throw new Error(`no arm ${opts.arm} in ${opts.loop}'s experiment.yaml`);
  if (!model) throw new Error(`no model ${opts.model} in ${opts.loop}'s experiment.yaml`);
  const cred = credentialFile(model.credentials);
  const image = build(opts.loop, expDir, opts.name);
  const commit = pluginCommit();
  const labelDir = path.join(expDir, 'runs', opts.label);
  fs.mkdirSync(labelDir, { recursive: true });
  const existing = fs.readdirSync(labelDir).filter((d) => d.startsWith(`${opts.arm}-${opts.model}-`)).length;

  const jobs = Array.from({ length: opts.runs }, (_, i) => {
    const n = existing + i + 1;
    const runId = `${opts.label}-${opts.arm}-${opts.model}-${n}`;
    const config = {
      loop: opts.loop,
      arm: opts.arm,
      model: opts.model,
      run_id: runId,
      overlay: arm.overlay ?? null,
      overlay_date: arm.committed_at ?? null,
      task: exp.task,
      ci: exp.ci,
      acceptance: exp.acceptance,
      judge_gets_model: exp.judge_gets_model === true,
      code_paths: exp.code_paths ?? ['src'],
      blocked_hosts: exp.blocked_hosts ?? [],
      sessions: exp.sessions ?? null,
      judge_minutes: exp.judge_minutes ?? 10,
      // An arm may change the person, e.g. a person who watches only in arm B.
      person: { ...(exp.person ?? {}), ...(arm.person ?? {}) },
      claude_env: model.env,
      credential_vars: cred.names,
      image: image.id,
      plugin_commit: commit,
    };
    return { config, outDir: path.join(labelDir, `${opts.arm}-${opts.model}-${n}`) };
  });

  console.log(`${jobs.length} run(s) of ${opts.loop}, arm ${opts.arm}, ${opts.model}, ${opts.parallel} at a time`);
  const queue = [...jobs];
  const workers = Array.from({ length: Math.min(opts.parallel, jobs.length) }, async () => {
    while (queue.length) {
      const job = queue.shift();
      const started = Date.now();
      console.log(`start ${job.config.run_id}`);
      const code = await runOne({ image, config: job.config, cred, outDir: job.outDir });
      let line;
      try {
        line = score(job.outDir);
      } catch (error) {
        line = { run: job.config.run_id, arm: opts.arm, model: opts.model, error: `no score: ${error.message}`, container_exit: code };
      }
      fs.appendFileSync(path.join(labelDir, 'runs.jsonl'), `${JSON.stringify(line)}\n`);
      const minutes = ((Date.now() - started) / 60000).toFixed(1);
      console.log(
        `done  ${job.config.run_id} in ${minutes} min: ended=${line.ended} first-done CI ${line.ci_green_at_first_done ? 'green' : `red (${line.first_red_step})`},` +
          ` reports=${line.person_reports}, acceptance ${line.acceptance}, type checks by agent=${line.agent_type_checks},` +
          ` hook refusals=${line.hook_refusals?.total ?? 0}${line.error ? `, error: ${line.error}` : ''}`,
      );
    }
  });
  await Promise.all(workers);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
