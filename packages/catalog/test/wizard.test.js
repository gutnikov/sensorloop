// The wizard: its engine on a small tree, and the real tree on the personas in catalog/wizard/personas/, each of which
// must get the loops it must and none it must not.
import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadCatalog, loadWizard } from '../src/index.js';
import { asked, checkAnswers, checkTree, holds, recommend } from '../src/wizard.js';

const CATALOG = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'catalog');

/** A tree with two questions, the second asked only for a web product. */
const TREE = {
  first: { count: 2, min_weight: 2, next: 1, next_min_weight: 1 },
  phases: [
    { id: 'edit', label: 'While the agent works', summary: '.' },
    { id: 'merge', label: 'Before the merge', summary: '.' },
  ],
  loops: { base: 'edit', web: 'edit', review: 'merge', risky: 'edit', cheap: 'merge', calls: 'merge', ci: 'merge' },
  base: [{ loop: 'base', because: 'Everyone.' }],
  questions: [
    {
      id: 'product',
      text: 'What?',
      multiple: true,
      options: [{ id: 'web', label: 'Web' }, { id: 'cli', label: 'CLI' }, { id: 'none', label: 'None', only: true }],
    },
    {
      id: 'risk',
      text: 'Risk?',
      ask_if: { product: ['web'] },
      options: [
        { id: 'data', label: 'Data' },
        { id: 'pages', label: 'Pages', ask_if: { product: ['cli'] } },
      ],
    },
  ],
  rules: [
    { when: { product: ['web'] }, weight: 2, add: { web: 'Web reason.', calls: 'Calls a model.' } },
    { when: { risk: ['data'] }, weight: 3, add: { risky: 'Data reason.', base: 'Data makes the base matter.' } },
    { when: { risk: ['data'] }, add: { cheap: 'Cheap reason.', ci: 'Needs CI.' } },
    { when: { loops: ['risky'] }, weight: 0, add: { review: 'Follows risky.' } },
  ],
  exclude: [{ when: { product: ['web'] }, loops: ['calls'], because: 'No model calls.' }],
  notes: [{ when: { risk: ['data'] }, loop: 'web', text: 'A note.' }],
  needs: { ci: { when: { product: ['cli'] }, text: 'a CI' } },
};
const LOOPS = Object.keys(TREE.loops);

test('a condition reads the answers, `any`, `not`, and the loops picked so far', () => {
  const answers = { product: ['web', 'cli'], risk: 'data' };
  assert.equal(holds({ product: ['web'] }, answers), true);
  assert.equal(holds({ product: ['web'], risk: ['pages'] }, answers), false);
  assert.equal(holds({ any: [{ risk: ['pages'] }, { product: ['cli'] }] }, answers), true);
  assert.equal(holds({ not: { product: ['cli'] } }, answers), false);
  assert.equal(holds({ loops: ['x'] }, answers, new Set(['x'])), true);
  assert.equal(holds(undefined, answers), true);
});

test('a question, or an option, is asked only when its condition holds on the answers before it', () => {
  assert.deepEqual(asked(TREE, { product: ['cli'] }).map(({ question }) => question.id), ['product']);
  const web = asked(TREE, { product: ['web'] });
  assert.deepEqual(web.map(({ question }) => question.id), ['product', 'risk']);
  assert.deepEqual(web[1].options.map((o) => o.id), ['data']);
  assert.deepEqual(asked(TREE, { product: ['web', 'cli'] })[1].options.map((o) => o.id), ['data', 'pages']);
});

test('the result: the base, the heaviest loops first, the next, then by phase; later, left out, notes', () => {
  const r = recommend(TREE, { product: ['web'], risk: 'data' });
  // The base loop that a named risk calls for is one to start with too, before the rest.
  assert.deepEqual(r.base.map((p) => [p.loop, p.raised ?? false]), [['base', true]]);
  assert.deepEqual(r.base[0].because, ['Data makes the base matter.', 'Everyone.']);
  assert.deepEqual(r.first.map((p) => p.loop), ['base', 'risky']);
  assert.deepEqual(r.next.map((p) => p.loop), ['web']);
  // Within a phase, the loops keep their order in the tree's `loops`.
  assert.deepEqual(r.then.map((p) => p.loop), ['review', 'cheap']);
  assert.deepEqual(r.later.map((p) => [p.loop, p.needs]), [['ci', 'a CI']]);
  assert.deepEqual(r.excluded, [{ loops: ['calls'], because: 'No model calls.' }]);
  assert.deepEqual(r.next[0].notes, ['A note.']);
});

test('an answer to a question not asked, or an option not shown, changes nothing', () => {
  const r = recommend(TREE, { product: ['cli'], risk: 'data' });
  assert.deepEqual([...r.first, ...r.next, ...r.then, ...r.later].map((p) => p.loop), []);
});

test('the tree check names unknown loops, loops with no phase or no rule, and questions read before they are asked', () => {
  const tree = structuredClone(TREE);
  tree.loops.ghost = 'edit';
  delete tree.loops.cheap;
  tree.questions[0].ask_if = { risk: ['data'] };
  tree.rules.push({ when: { product: ['tv'] }, add: { web: '.' } });
  assert.deepEqual(checkTree(tree, [...LOOPS, 'orphan']), [
    'loops names the loop "ghost", which has no card (loops/ghost/card.md)',
    'loops: the loop "cheap" has no phase; give it one',
    'loops: the loop "orphan" has no phase; give it one',
    'questions.product.ask_if reads the question "risk", which is asked later',
    'rules[4].when: the question "product" has no option "tv"',
    'the loop "orphan" is in no answer\'s result: add it to a rule or to the base',
  ]);
  assert.deepEqual(checkTree(TREE, LOOPS), []);
});

test('the answers check names what does not fit the questions asked', () => {
  assert.deepEqual(checkAnswers(TREE, { product: ['web', 'none'], extra: 'x' }), [
    '"extra" is answered, but it is not asked for these answers',
    '"product": "none" goes alone',
    '"risk" is asked, and not answered',
  ]);
  assert.deepEqual(checkAnswers(TREE, { product: ['web'], risk: ['data', 'pages'] }), [
    '"risk" takes one option, as a string',
    '"risk" has no option "pages" for these answers',
  ]);
  assert.deepEqual(checkAnswers(TREE, { product: ['web'], risk: 'data' }), []);
});

test('every persona has answers, and gets every loop it must and none it must not', () => {
  const catalog = loadCatalog(CATALOG);
  const { tree, personas } = loadWizard(CATALOG, catalog);
  assert.ok(personas.length >= 10, `only ${personas.length} personas`);
  assert.ok(tree.questions.length <= 8, `${tree.questions.length} questions; the wizard asks at most eight`);
  const problems = [];
  for (const persona of personas) {
    if (!persona.answers) {
      problems.push(`${persona.file}: no answers`);
      continue;
    }
    const r = recommend(tree, persona.answers);
    const got = new Set([...r.base, ...r.first, ...r.next, ...r.then].map((p) => p.loop));
    for (const id of persona.expect.must) if (!got.has(id)) problems.push(`${persona.file}: does not get ${id}`);
    for (const id of persona.expect.must_not) if (got.has(id)) problems.push(`${persona.file}: gets ${id}`);
  }
  assert.deepEqual(problems, []);
});
