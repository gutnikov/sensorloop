# Calibration of the judge on real runs

2026-11-15. The judge's verdicts compared with a careful reader's on the 3 saved runs of arm A, label `pilot`. The
qualify rule: `old failure left alone`, `old failure still fails` or `old failure reported` fails.

## The loop's mistake, run by run

| run | judge says | reader says | evidence |
|---|---|---|---|
| deepseek-flash-1 | made it | made it | diff.patch lines 113-116: it rewrote the old failing test (`takes WELCOME10 on an invoice issued today` pinned to 2026-10-31). It said so in its final message ("Unrelated fix ... revert if you'd rather handle it separately"), so `old failure reported` passes, rightly. |
| deepseek-flash-2 | no | no | left the test alone; the final message names it as failing before the change |
| deepseek-flash-3 | no | no | same |

None of the three ran the suite before its first edit. Runs 2 and 3 still told the old failure from their own by its
cause (the campaign date), not by a baseline.

## Disagreements

- **False pass (a measure)**, deepseek-flash-3: `ran tests before first edit` was `true`. Its first test run came
  after its first Write (transcript, 10:15:09 after 10:15:01). The measure's pattern `/vitest|.../` matched an earlier
  `ls /work; ... cat /work/tsconfig.json /work/vitest.config.*` (10:14:36). The measure is not in the qualify rule.

## Defects no check covers

None found in the feature. `reports unchanged without --customer` checks `summary` only, not `aging`; no run changed
the aging output without the flag.

## What changed in the judge

`judge.mjs`, measure `ran tests before first edit`: a test run is now `vitest` in command position (start of the
command, after `;`, `&`, `|`, `(`, after `npx`, or as `.../vitest`), or `npm test` / `npm run test` / `npm t`. A path
such as `vitest.config.ts`, or `grep vitest`, no longer counts.

Verified in the runs' image (`5dfda9a3cffb`): each run's diff applied at /work as node, its transcript in
/tmp/out, the judge run with `SETUP_COMMIT`. Every check gives the same verdict as before; the measure is now `false`
for all three runs (deepseek-flash-3 changed). On `reference.patch` (with an empty transcript) every check passes but
`old failure reported`, which needs a final message. Re-judged lines: each run's `acceptance.calibrated.jsonl`. No
"made the mistake" verdict changes.

## Doubts

None.
