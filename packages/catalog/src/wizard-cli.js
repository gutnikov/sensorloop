#!/usr/bin/env node
// The wizard on the command line, for the rounds that improve it on the personas (catalog/wizard/personas/).
//
//   node src/wizard-cli.js questions            the questions, as the page asks them, with when each is asked
//   node src/wizard-cli.js loops                every loop: id, title and summary
//   node src/wizard-cli.js run <answers>        the result for a JSON or YAML file of answers (or a persona's file)
//   node src/wizard-cli.js personas [--json]    every persona with answers: its result, and what it must and must not get
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { loadCatalog, loadWizard } from './index.js';
import { asked, checkAnswers, recommend } from './wizard.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'catalog');
const catalog = loadCatalog(root);
const { tree, personas } = loadWizard(root, catalog);
const title = (/** @type {string} */ id) => catalog.get('loops', id).data.title;

/** A condition in words: "path is servers or installed". */
function words(/** @type {any} */ c) {
  return Object.entries(c)
    .map(([k, v]) =>
      k === 'any' ? `(${v.map(words).join(') or (')})` : k === 'not' ? `not (${words(v)})` : `${k} is ${v.join(' or ')}`,
    )
    .join(' and ');
}

function questions() {
  tree.questions.forEach((/** @type {any} */ q, /** @type {number} */ i) => {
    console.log(`Q${i + 1} [${q.id}] ${q.text}${q.multiple ? ' (pick all that apply)' : ' (pick one)'}`);
    if (q.hint) console.log(`   hint: ${q.hint}`);
    if (q.ask_if) console.log(`   asked only when ${words(q.ask_if)}`);
    for (const o of q.options) {
      const extra = [o.only ? 'goes alone' : '', o.ask_if ? `shown only when ${words(o.ask_if)}` : ''].filter(Boolean);
      console.log(`   - ${o.id}: ${o.label}${extra.length ? `  [${extra.join('; ')}]` : ''}`);
    }
    console.log('');
  });
}

/** @param {any} answers */
function show(answers) {
  const problems = checkAnswers(tree, answers);
  if (problems.length) console.log(`! the answers do not fit the tree:\n${problems.map((p) => `  - ${p}`).join('\n')}\n`);
  console.log(`Asked: ${asked(tree, answers).map(({ question }) => question.id).join(', ')}\n`);
  const r = recommend(tree, answers);
  const line = (/** @type {any} */ p) =>
    `  - ${p.loop} (${title(p.loop)})${p.needs ? `, needs ${p.needs}` : ''}${p.raised ? ' [base; also a first step for you]' : ''}\n` +
    p.because.map((/** @type {string} */ b) => `      because: ${b}`).join('\n') +
    (p.notes.length ? `\n${p.notes.map((/** @type {string} */ n) => `      note: ${n}`).join('\n')}` : '');
  console.log(`BASE (${r.base.length}, every project)\n${r.base.map(line).join('\n')}\n`);
  console.log(`START WITH (${r.first.length}, the loops your answers call for most)\n${r.first.map(line).join('\n')}\n`);
  if (r.next.length) console.log(`NEXT (${r.next.length})\n${r.next.map(line).join('\n')}\n`);
  for (const phase of tree.phases) {
    const here = r.then.filter((p) => p.phase === phase.id);
    if (here.length) console.log(`THEN, ${phase.label.toUpperCase()} (${here.length})\n${here.map(line).join('\n')}\n`);
  }
  if (r.later.length) console.log(`LATER, once you have what they need (${r.later.length})\n${r.later.map(line).join('\n')}\n`);
  for (const e of r.excluded) console.log(`LEFT OUT: ${e.loops.join(', ')}\n  because: ${e.because}\n`);
  console.log(
    `Total: ${r.base.length} base, ${r.first.length} to start with, ${r.next.length} next, ${r.then.length} then, ${r.later.length} later`,
  );
}

/** @param {any} persona */
function score(persona) {
  const r = recommend(tree, persona.answers);
  const got = new Set([...r.base, ...r.first, ...r.next, ...r.then].map((p) => p.loop));
  const later = new Set(r.later.map((p) => p.loop));
  const missing = persona.expect.must.filter((/** @type {string} */ id) => !got.has(id));
  const unwanted = persona.expect.must_not.filter((/** @type {string} */ id) => got.has(id));
  return {
    id: persona.id,
    picked: r.first.length + r.next.length + r.then.length,
    first: r.first.map((p) => p.loop),
    later: r.later.length,
    missing: missing.map((/** @type {string} */ id) => (later.has(id) ? `${id} (later)` : id)),
    unwanted,
  };
}

const [command, arg] = process.argv.slice(2);
if (command === 'questions') questions();
else if (command === 'loops') {
  for (const loop of catalog.loops) console.log(`- ${loop.id}: ${loop.data.title}. ${loop.data.summary}`);
} else if (command === 'run' && arg) {
  const data = YAML.parse(fs.readFileSync(arg, 'utf8'));
  show(data.answers ?? data);
} else if (command === 'personas') {
  const scores = personas.filter((p) => p.answers).map(score);
  if (arg === '--json') console.log(JSON.stringify(scores, null, 2));
  else {
    for (const s of scores) {
      const ok = s.missing.length === 0 && s.unwanted.length === 0;
      console.log(
        `${ok ? 'ok  ' : 'FAIL'} ${s.id}: ${s.picked} picked, ${s.later} later; first ${s.first.join(', ')}` +
          (s.missing.length ? `; missing ${s.missing.join(', ')}` : '') +
          (s.unwanted.length ? `; unwanted ${s.unwanted.join(', ')}` : ''),
      );
    }
    console.log(`${scores.filter((s) => !s.missing.length && !s.unwanted.length).length}/${scores.length} personas get what they must`);
  }
} else {
  console.error('usage: wizard-cli.js questions | loops | run <answers file> | personas [--json]');
  process.exit(2);
}
