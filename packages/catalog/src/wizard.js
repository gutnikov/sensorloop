// @ts-check
/**
 * The wizard: which of its questions are asked, given the answers so far, and the loops the answers call for. The
 * tree is catalog/wizard/tree.yaml (read and checked by loadWizard in index.js). This module reads no files, so the
 * site's page runs the same code in the browser as `npm run check` runs on the personas.
 *
 * Answers map a question's id to an option's id, or to a list of them for a question with `multiple`.
 */

/** @typedef {Record<string, string | string[]>} Answers */

/**
 * @typedef {object} Pick       a loop in the result
 * @property {string} loop
 * @property {string} phase
 * @property {string[]} because  the reasons of the rules (or the base) that added it, the heaviest rule's first
 * @property {string[]} notes    lines for this project
 * @property {number} weight     the total weight of the rules that added it
 * @property {boolean} [raised]  for a base loop: the answers call for it most, so it is also one to start with
 * @property {string} [needs]    for a loop under `later`: what the project lacks for it
 */

/**
 * @typedef {object} Result
 * @property {Pick[]} base      every project's loops, in the order to set them up
 * @property {Pick[]} first     the loops to start with, beyond the base: the heaviest, heaviest first
 * @property {Pick[]} next      the loops to add next: the heaviest of the rest
 * @property {Pick[]} then      the other loops the answers call for, in phase order
 * @property {Pick[]} later     loops the answers call for, which need something the project does not have yet
 * @property {{ loops: string[], because: string }[]} excluded   loops the answers rule out, and why
 */

const list = (/** @type {string | string[] | undefined} */ value) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

/**
 * Whether a condition holds for these answers and the loops picked so far.
 * @param {Record<string, any> | undefined} condition
 * @param {Answers} answers
 * @param {Set<string>} [loops]
 * @returns {boolean}
 */
export function holds(condition, answers, loops = new Set()) {
  if (!condition) return true;
  return Object.entries(condition).every(([key, value]) => {
    if (key === 'any') return value.some((/** @type {any} */ c) => holds(c, answers, loops));
    if (key === 'not') return !holds(value, answers, loops);
    if (key === 'loops') return value.some((/** @type {string} */ id) => loops.has(id));
    const given = list(answers[key]);
    return value.some((/** @type {string} */ option) => given.includes(option));
  });
}

/**
 * The questions asked for these answers, in order, each with the options it shows. A question's `ask_if` reads only
 * the answers to the questions asked before it.
 * @param {any} tree
 * @param {Answers} answers
 * @returns {{ question: any, options: any[] }[]}
 */
export function asked(tree, answers) {
  /** @type {Answers} */
  const before = {};
  const shown = [];
  for (const question of tree.questions) {
    if (!holds(question.ask_if, before)) continue;
    const options = question.options.filter((/** @type {any} */ o) => holds(o.ask_if, before));
    shown.push({ question, options });
    const ids = new Set(options.map((/** @type {any} */ o) => o.id));
    const kept = list(answers[question.id]).filter((id) => ids.has(id));
    if (kept.length > 0) before[question.id] = question.multiple ? kept : kept[0];
  }
  return shown;
}

/**
 * The answers to the questions asked, with only the options shown: what the result is computed from.
 * @param {any} tree
 * @param {Answers} answers
 * @returns {Answers}
 */
export function clean(tree, answers) {
  /** @type {Answers} */
  const kept = {};
  for (const { question, options } of asked(tree, answers)) {
    const ids = new Set(options.map((o) => o.id));
    const given = list(answers[question.id]).filter((id) => ids.has(id));
    if (given.length > 0) kept[question.id] = question.multiple ? given : given[0];
  }
  return kept;
}

/**
 * The loops these answers call for.
 * @param {any} tree
 * @param {Answers} answers
 * @returns {Result}
 */
export function recommend(tree, answers) {
  const given = clean(tree, answers);
  /** @type {Map<string, Pick>} */
  const picks = new Map();
  /** @type {Map<string, Map<string, number>>} each loop's reasons, with the weight of the rule that gave each */
  const reasons = new Map();
  /** @type {Map<string, number>} each loop's heaviest single rule: among equal totals, the one an answer calls for most */
  const strongest = new Map();
  const add = (/** @type {string} */ loop, /** @type {string} */ because, /** @type {number} */ weight) => {
    strongest.set(loop, Math.max(strongest.get(loop) ?? 0, weight));
    const pick = picks.get(loop) ?? { loop, phase: tree.loops[loop], because: [], notes: [], weight: 0 };
    const own = reasons.get(loop) ?? new Map();
    if (!own.has(because)) own.set(because, weight);
    reasons.set(loop, own);
    pick.weight += weight;
    picks.set(loop, pick);
  };

  const base = tree.base.map((/** @type {any} */ b) => b.loop);
  for (const b of tree.base) add(b.loop, b.because, 0);
  for (const rule of tree.rules) {
    if (!holds(rule.when, given, new Set(picks.keys()))) continue;
    for (const [loop, because] of Object.entries(rule.add)) add(loop, /** @type {string} */ (because), rule.weight ?? 1);
  }
  // The reason of the heaviest rule comes first; among equals, the one given first.
  for (const [loop, own] of reasons) {
    const order = [...own.keys()];
    /** @type {Pick} */ (picks.get(loop)).because = order.sort(
      (a, b) => (own.get(b) ?? 0) - (own.get(a) ?? 0) || order.indexOf(a) - order.indexOf(b),
    );
  }
  for (const note of tree.notes ?? []) {
    const pick = picks.get(note.loop);
    if (pick && holds(note.when, given, new Set(picks.keys())) && !pick.notes.includes(note.text)) {
      pick.notes.push(note.text);
    }
  }

  const phase = new Map(tree.phases.map((/** @type {any} */ p, /** @type {number} */ i) => [p.id, i]));
  const index = new Map(Object.keys(tree.loops).map((id, i) => [id, i]));
  const byPhase = (/** @type {Pick} */ a, /** @type {Pick} */ b) =>
    (phase.get(a.phase) ?? 0) - (phase.get(b.phase) ?? 0) || (index.get(a.loop) ?? 0) - (index.get(b.loop) ?? 0);
  const added = [...picks.keys()];

  /** @type {Result} */
  const result = { base: [], first: [], next: [], then: [], later: [], excluded: [] };
  /** @type {Set<string>} */
  const out = new Set();
  for (const rule of tree.exclude ?? []) {
    if (!holds(rule.when, given)) continue;
    const loops = rule.loops.filter((/** @type {string} */ id) => picks.has(id) && !base.includes(id));
    loops.forEach((/** @type {string} */ id) => out.add(id));
    if (loops.length > 0) result.excluded.push({ loops, because: rule.because });
  }
  /** @type {Pick[]} */
  const picked = [];
  for (const pick of picks.values()) {
    const need = tree.needs?.[pick.loop];
    if (out.has(pick.loop)) continue;
    if (base.includes(pick.loop)) result.base.push(pick);
    else if (need && !holds(need.when, given, new Set(picks.keys()))) result.later.push({ ...pick, needs: need.text });
    else picked.push(pick);
  }
  result.base.sort((a, b) => base.indexOf(a.loop) - base.indexOf(b.loop));
  const { count = 5, min_weight = 2, next = 5, next_min_weight = 1 } = tree.first ?? {};
  const byWeight = (/** @type {Pick} */ a, /** @type {Pick} */ b) =>
    b.weight - a.weight ||
    (strongest.get(b.loop) ?? 0) - (strongest.get(a.loop) ?? 0) ||
    added.indexOf(a.loop) - added.indexOf(b.loop);
  const heaviest = picked.sort(byWeight);
  // A base loop that the answers call for most (a named risk and more) is one to start with too, and comes first.
  for (const pick of result.base) if (pick.weight > min_weight) pick.raised = true;
  const raised = result.base.filter((p) => p.raised).sort(byWeight);
  result.first = [...raised, ...heaviest.filter((p) => p.weight >= min_weight)].slice(0, count);
  result.next = heaviest.filter((p) => !result.first.includes(p) && p.weight >= next_min_weight).slice(0, next);
  result.then = heaviest.filter((p) => !result.first.includes(p) && !result.next.includes(p)).sort(byPhase);
  result.later.sort(byPhase);
  return result;
}

/**
 * What is wrong with a tree's references: loops that are not in the catalog, questions and options that do not
 * exist or come later, loops no rule reaches. The shape is checked by the schema first.
 * @param {any} tree
 * @param {string[]} catalogLoops  the ids of the catalog's loops
 * @returns {string[]}
 */
export function checkTree(tree, catalogLoops) {
  /** @type {string[]} */
  const problems = [];
  const known = new Set(catalogLoops);
  const phases = new Set(tree.phases.map((/** @type {any} */ p) => p.id));
  const loop = (/** @type {string} */ id, /** @type {string} */ where) => {
    if (!known.has(id)) problems.push(`${where} names the loop "${id}", which has no card (loops/${id}/card.md)`);
  };

  for (const [id, phase] of Object.entries(tree.loops)) {
    loop(id, 'loops');
    if (!phases.has(phase)) problems.push(`loops: "${id}" is in the phase "${phase}", which is not in phases`);
  }
  for (const id of catalogLoops) {
    if (!(id in tree.loops)) problems.push(`loops: the loop "${id}" has no phase; give it one`);
  }

  /** Every question, and its options. */
  const all = new Map(
    tree.questions.map((/** @type {any} */ q) => [q.id, new Set(q.options.map((/** @type {any} */ o) => o.id))]),
  );
  /**
   * @param {any} condition
   * @param {string} where
   * @param {Map<string, Set<string>>} scope  the questions the condition may read
   */
  const check = (condition, where, scope) => {
    for (const [key, value] of Object.entries(condition ?? {})) {
      if (key === 'any') value.forEach((/** @type {any} */ c) => check(c, where, scope));
      else if (key === 'not') check(value, where, scope);
      else if (key === 'loops') value.forEach((/** @type {string} */ id) => loop(id, where));
      else if (!scope.has(key)) {
        problems.push(`${where} reads the question "${key}", which ${all.has(key) ? 'is asked later' : 'does not exist'}`);
      } else {
        for (const option of value) {
          if (!scope.get(key)?.has(option)) problems.push(`${where}: the question "${key}" has no option "${option}"`);
        }
      }
    }
  };

  // A question's ask_if, and its options', read only the questions before it.
  /** @type {Map<string, Set<string>>} */
  const before = new Map();
  const seen = new Set();
  for (const question of tree.questions) {
    if (seen.has(question.id)) problems.push(`questions: "${question.id}" is asked twice`);
    seen.add(question.id);
    check(question.ask_if, `questions.${question.id}.ask_if`, before);
    const ids = new Set();
    for (const option of question.options) {
      if (ids.has(option.id)) problems.push(`questions.${question.id}: the option "${option.id}" is there twice`);
      ids.add(option.id);
      check(option.ask_if, `questions.${question.id}.${option.id}.ask_if`, before);
    }
    before.set(question.id, ids);
  }

  const reached = new Set(tree.base.map((/** @type {any} */ b) => b.loop));
  tree.base.forEach((/** @type {any} */ b, /** @type {number} */ i) => loop(b.loop, `base[${i}]`));
  tree.rules.forEach((/** @type {any} */ rule, /** @type {number} */ i) => {
    check(rule.when, `rules[${i}].when`, all);
    for (const id of Object.keys(rule.add)) {
      loop(id, `rules[${i}].add`);
      reached.add(id);
    }
  });
  (tree.exclude ?? []).forEach((/** @type {any} */ rule, /** @type {number} */ i) => {
    check(rule.when, `exclude[${i}].when`, all);
    rule.loops.forEach((/** @type {string} */ id) => loop(id, `exclude[${i}].loops`));
  });
  (tree.notes ?? []).forEach((/** @type {any} */ note, /** @type {number} */ i) => {
    check(note.when, `notes[${i}].when`, all);
    loop(note.loop, `notes[${i}]`);
  });
  for (const [id, need] of Object.entries(tree.needs ?? {})) {
    loop(id, 'needs');
    check(need.when, `needs.${id}.when`, all);
  }
  for (const id of catalogLoops) {
    if (!reached.has(id)) problems.push(`the loop "${id}" is in no answer's result: add it to a rule or to the base`);
  }
  return problems;
}

/**
 * What is wrong with a set of answers: an answer to a question not asked, an option not shown, two options to a
 * question that takes one, an `only` option with others, a question asked and not answered.
 * @param {any} tree
 * @param {Answers} answers
 * @returns {string[]}
 */
export function checkAnswers(tree, answers) {
  /** @type {string[]} */
  const problems = [];
  const shown = asked(tree, answers);
  const ids = new Set(shown.map(({ question }) => question.id));
  for (const key of Object.keys(answers)) {
    if (!ids.has(key)) problems.push(`"${key}" is answered, but it is not asked for these answers`);
  }
  for (const { question, options } of shown) {
    const given = list(answers[question.id]);
    const byId = new Map(options.map((o) => [o.id, o]));
    if (given.length === 0) problems.push(`"${question.id}" is asked, and not answered`);
    if (!question.multiple && (given.length > 1 || Array.isArray(answers[question.id]))) {
      problems.push(`"${question.id}" takes one option, as a string`);
    }
    for (const id of given) {
      if (!byId.has(id)) problems.push(`"${question.id}" has no option "${id}" for these answers`);
      else if (byId.get(id).only && given.length > 1) problems.push(`"${question.id}": "${id}" goes alone`);
    }
  }
  return problems;
}
