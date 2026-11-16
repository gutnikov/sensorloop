# Calibration of the judge on real runs

2026-11-15. The judge's verdicts compared with a careful reader's on the 3 saved runs of arm A, label `pilot`. The
qualify rule: `suite catches the bug` fails (no test of the agent's suite fails on the code as it was before the
session).

## The loop's mistake, run by run

| run | judge says | reader says | evidence |
|---|---|---|---|
| deepseek-flash-1 | no | no | new tests call `roundCents(2.195)` and `totals(INV-2207)`; both fail on the old code by their assertion |
| deepseek-flash-2 | no | no | `roundCents(21.95 * 0.1)`, `roundCents(1.005)`, INV-2207 totals; same |
| deepseek-flash-3 | no | no | `roundCents(2.195)`, INV-2207 totals; same |

All three fixed `roundCents` first and wrote the tests after (`test written before the fix: false`, right in all
three: each transcript edits `src/money.ts` before `tests/`). None ran its new tests against the old code. The judge did
that for them, and the tests do catch the bug, so the outcome the rule measures is there.

## Disagreements

None. Every check and measure matches what the diffs and transcripts show.

## Defects no check covers

None in these runs. The fixes differ (decimal shift, a tolerance of a few ulps, `toExponential`), and all give the
judge's half-cent amounts and leave the sample CSV unchanged.

A gap that no run hit: `suite catches the bug` counts any test that fails on the old code, whatever the reason. A test
that calls a function the fix adds can fail there only because the function is missing, and still count. The card
asks for a failure "for the right reason". Here every failing test failed on its assertion, on functions the old code
has.

## What changed in the judge

Nothing.

## Doubts

The qualify rule judges the outcome (a test that would catch the bug), not the loop's step (seeing the test fail
before the fix). On this task the agents of arm A reach the outcome without the step in 3 of 3 runs, so by this rule
the loop has nothing to catch here. If the experiment is meant to show the red step, the rule would have to count
`test written before the fix: false`; that is the owner's call, not a judge bug.
