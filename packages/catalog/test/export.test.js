// The exporter's --check against a fresh export of the repository's catalog: it passes on the copy it just wrote, and
// names each file of a copy that drifted, without writing to it.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const EXPORT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'export.js');
const run = (...args) => spawnSync(process.execPath, [EXPORT, ...args], { encoding: 'utf8' });

test('--check passes on a fresh export, and lists a changed, a missing and an extra file', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'sensorloop-export-test-'));
  assert.equal(run(out).status, 0);
  assert.equal(run('--check', out).status, 0);

  fs.appendFileSync(path.join(out, 'index.md'), 'edited by hand\n');
  const sensor = fs.readdirSync(path.join(out, 'sensors'))[0];
  fs.rmSync(path.join(out, 'sensors', sensor));
  fs.writeFileSync(path.join(out, 'tools', 'not-a-card.md'), '');
  const before = fs.readFileSync(path.join(out, 'index.md'), 'utf8');

  const result = run('--check', out);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /changed {2}index\.md/);
  assert.match(result.stderr, new RegExp(`missing {2}sensors/${sensor.replace('.', '\\.')}`));
  assert.match(result.stderr, /extra {4}tools\/not-a-card\.md/);
  assert.equal(fs.readFileSync(path.join(out, 'index.md'), 'utf8'), before, '--check wrote to the folder it checks');
  fs.rmSync(out, { recursive: true, force: true });
});
