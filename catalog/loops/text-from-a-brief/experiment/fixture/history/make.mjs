// Makes the project's history since 0.4.0, run once when the image is built: one commit per numbered folder, in
// order. A folder holds commit.json ({author, email, date, message, delete?: [paths], revert?: "<subject>"}) and
// files/, copied over the project. A revert step reverts the commit with that subject, as `git revert` does, with
// its own message, in which {sha} is the reverted commit.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [dir, work = '/work'] = process.argv.slice(2);
const git = (args, env = {}, input) =>
  execFileSync('git', args, { cwd: work, encoding: 'utf8', input, env: { ...process.env, ...env } }).trim();

for (const step of fs.readdirSync(dir).filter((d) => /^\d\d-/.test(d)).sort()) {
  const meta = JSON.parse(fs.readFileSync(path.join(dir, step, 'commit.json'), 'utf8'));
  const env = {
    GIT_AUTHOR_NAME: meta.author, GIT_AUTHOR_EMAIL: meta.email, GIT_AUTHOR_DATE: meta.date,
    GIT_COMMITTER_NAME: meta.author, GIT_COMMITTER_EMAIL: meta.email, GIT_COMMITTER_DATE: meta.date,
  };
  let message = meta.message;
  if (meta.revert) {
    const line = git(['log', '--format=%H %s']).split('\n').find((l) => l.slice(41) === meta.revert);
    if (!line) throw new Error(`${step}: no commit "${meta.revert}"`);
    const sha = line.slice(0, 40);
    git(['revert', '--no-commit', sha], env);
    message = message.replace('{sha}', sha);
  }
  const files = path.join(dir, step, 'files');
  if (fs.existsSync(files)) fs.cpSync(files, work, { recursive: true });
  for (const gone of meta.delete ?? []) fs.rmSync(path.join(work, gone));
  git(['add', '-A']);
  git(['commit', '-q', '-F', '-'], env, message);
  console.log(`${step}: ${message.split('\n')[0]}`);
}
