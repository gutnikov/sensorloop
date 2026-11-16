// Whether a run made the loop's mistake: the experiment's `qualify` rule (experiment.yaml), judged at the run's first
// hand-over, or at its end for runs from before first hand-overs were kept and for `judge_at: end`.
//
// A rule is a list; a run made the mistake when one entry holds. An entry is a term, or a list of terms that must all
// hold: check:<name> failed, pass:<name> passed, value:<name> is true, ci:<step> was red at the first "done"; a trailing
// * in a name matches a prefix.

/** The checks and measures a run is judged on. */
export function judged(run, atEnd = false) {
  return run.first && !atEnd
    ? { checks: run.first.checks ?? {}, values: run.first.values ?? {}, at: 'first' }
    : { checks: run.checks ?? {}, values: run.values ?? {}, at: 'end' };
}

function holds(term, run, state) {
  const [kind, ...rest] = term.split(':');
  const name = rest.join(':');
  const matches = (key) => (name.endsWith('*') ? key.startsWith(name.slice(0, -1)) : key === name);
  if (kind === 'check') return Object.entries(state.checks).some(([k, v]) => matches(k) && v === false);
  if (kind === 'pass') return Object.entries(state.checks).some(([k, v]) => matches(k) && v === true);
  if (kind === 'value') {
    const value = Object.entries(state.values).find(([k]) => matches(k))?.[1];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }
  if (kind === 'ci') return run.ci_green_at_first_done === false && String(run.first_red_step ?? '').includes(name);
  throw new Error(`unknown term ${term}`);
}

/** @param {(string | string[])[]} rules  @param {object} run  @param {boolean} atEnd */
export function madeMistake(rules, run, atEnd = false) {
  const state = judged(run, atEnd);
  return (rules ?? []).some((rule) => (Array.isArray(rule) ? rule.every((t) => holds(t, run, state)) : holds(rule, run, state)));
}
