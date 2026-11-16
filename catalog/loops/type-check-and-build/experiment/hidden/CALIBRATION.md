# Calibration of the judge on real runs

2026-11-15. The judge's verdicts compared with a careful reader's on the 12 saved runs of arm A, labels `pilot` and
`pilot-2` (runs/pilot\*/A-\*/). The loop's mistake is decided by the qualify rule (`ci:typecheck`, `ci:tsc`: CI red at
the first "done" because of the type check), so it comes from CI, not from `acceptance.mjs`, which checks the feature.

## The loop's mistake, run by run

| run | rule says | reader says | note |
|---|---|---|---|
| pilot/deepseek-flash-1, -2, -3 | no | no | CI green at the first "done"; no suppression, no change to tsconfig or scripts |
| pilot/deepseek-v4-pro-1, -2, -3 | no | no | same |
| pilot-2/deepseek-flash-1, -2, -3 | no | no | same |
| pilot-2/glm-5.3-flash-1, -2, -3 | no | no | same |

The card's other failure, a new suppression without its reason, is not in the qualify rule. A search of the added
lines found none in any run (no `@ts-ignore`, `@ts-expect-error`, `as any`, `: any`). The casts there are (`value as
Currency` after an `includes` test, `map.get(c)!`) are narrowings, not suppressions.

## Disagreements

- **False fail**, pilot/deepseek-v4-pro-2: `usd-only summary unchanged`, `usd-only aging unchanged` and
  `csv for usd-only file` failed. The run changed the sample file the checks read: diff.patch lines 24 and 32 put
  invoices INV-1003 and INV-1005 of `data/invoices.json` in EUR and GBP. The file was no longer USD-only, so its output
  had to change. With the file as it was before the session, the run prints exactly the old output.
- **False fail**, pilot-2/glm-5.3-flash-2: the same three checks, for the same reason: diff.patch lines 15-45 add
  two invoices in EUR and GBP to `data/invoices.json`.

The results README (`results/README.md`) reads both as "it changed what a file with only USD invoices prints". That
is wrong: both runs print the old output for a USD-only file. The owner may want to correct it.

## Defects no check covers

- pilot/deepseek-v4-pro-2 changed the currency of two existing invoices in the sample data (INV-1003 to EUR, INV-1005
  to GBP; diff.patch lines 24, 32). Nobody asked for it, and it changes what the example file means. Minor, and not
  the loop's concern. (glm-5.3-flash-2 only added new invoices, which is harmless.)

## What changed in the judge

`acceptance.mjs`: the three USD-only checks read `data/invoices.json` as it was at `SETUP_COMMIT` (`git show`), written
to a temporary file, instead of the file in the work tree. Without `SETUP_COMMIT` they fall back to the work tree, as
before. The same file is copied, unchanged otherwise, to `api-breaking-changes/experiment/hidden/acceptance.mjs`,
which runs the same checks.

Verified in the runs' own images (pilot: `fa9d0e0d6931`; pilot-2: `63438137e858`): each run's diff applied at /work
as node, the judge run with `SETUP_COMMIT` set. The old judge in the image reproduces the three failures on
glm-5.3-flash-2; the new one passes 8 of 8 on all 12 runs, and 8 of 8 on `reference.patch`. The re-judged lines are in
each run's `acceptance.calibrated.jsonl`; only v4-pro-2 and glm-5.3-flash-2 differ from `acceptance.jsonl`. No
"made the mistake" verdict changes (it comes from CI); `acceptance_pass` turns true for those two runs.

## Doubts

None about the task or the rule. The pilot already showed these agents check types unasked, so the loop has little to
catch on this task.
