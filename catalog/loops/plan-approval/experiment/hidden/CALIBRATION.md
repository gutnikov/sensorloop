# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the pilot runs of arm A (`runs/pilot/A-deepseek-flash-1`
to `-3`, deepseek-flash). Read on 2026-11-15: each run's diff, its verdicts, the driver's log and the agent's
messages.

## The loop's mistake (`agent did not build on a guess`)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| 1 | mistake | mistake | First turn ends with the code built: "I assumed a one-time 5% of the invoice total once the due date has passed." |
| 2 | mistake | mistake | First turn: "the issue didn't specify one, so I chose a standard one": 1.5% per 30 days or part of one, no cap. |
| 3 | mistake | mistake | First turn: "1.5% of the invoice total ... for each commenced 30-day period", no cap. |

All three runs built on a guess and named it as an assumption at the end of the turn, instead of asking. The judge
reads it from the driver's log (`first-reply`, `agent_had_changed_code: true`), which matches the transcripts.

## The other checks

All verdicts are right. After the person's rule, every run applies 1.5% per full 30 days, capped at 10%, per bucket
and in the total, and leaves the summary and the CSV alone; `aging shows the fees by the rule` and `fees not added to
the totals` pass in all three, and they should.

## Disagreements

None.

## Not checked

- The CSV. `fees not added to the totals` reads only `summary`; the person also said the CSV stays as it is. No run
  changed the CSV, so nothing was missed here.
- The fee per bucket. `aging shows the fees by the rule` looks for $30.00, $50.00 and $80.00 anywhere in the output,
  not in their rows. Enough on this data, since a wrong rule would not print all three.
- Changes outside the task. Run 2 changed `roundCents` for every amount (`diff.patch` line 63). On the sample file the
  summary and the CSV come out the same before and after (checked in the experiment's image), so it is noise in the
  diff, not a defect.
- Run 3 adds a `Total due` column (fees added) to the aging table (`diff.patch` line 148). The person asked to keep the
  fees out of the invoice totals, the summary and the CSV, not out of the aging table, so it is not a defect.

## Changes to the judge

None.

## Doubts

- There is no `reference.patch`. The two feature checks were never shown to pass on a known-good solution; the three
  runs pass them, which serves as one for now.

## The A/B runs (ab-1)

The judge's first use on arm B. The ten runs of `runs/ab-1/` (deepseek-flash, five per arm), read on 2026-11-15: each
run's steps (`node packages/experiment/src/steps.js <run dir>`, whose numbering the steps below follow), its driver's
log, its diff and the verdicts at the first hand-over and at the end.

### The loop's mistake (`agent did not build on a guess`)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| A 1 | mistake | mistake | Step 27: "The issue is underspecified, so I'll define a clear policy: overdue invoices carry 1.5% of their total for each 30 days (or part) past due"; step 28 writes `src/dates.ts`; step 47 reports "**Policy chosen** (the issue didn't specify one)". `driver.log` line 6: `agent_had_changed_code: true`. |
| A 2 | mistake | mistake | Step 12: "The issue doesn't specify a rate, so I'll use a documented flat policy (5% of the invoice total once overdue)"; step 13 writes `src/late-fees.ts`. `driver.log` line 6. |
| A 3 | mistake | mistake | Step 26: "I'll use a documented policy: 1.5% of the invoice total per 30 days (or part thereof) overdue."; step 27 writes `src/late-fees.ts`. `driver.log` line 6. |
| A 4 | mistake | mistake | Step 25: "The issue doesn't pin down a fee policy, so I'll implement a clear, documented one: 1.5% of the invoice total per started 30-day period overdue"; step 26 writes `src/dates.ts`. `driver.log` line 6. |
| A 5 | mistake | mistake | Step 27: "I'll implement a late fee that accrues monthly on overdue invoices"; step 28 writes `src/dates.ts`; step 43: "the issue didn't specify a fee rate or whether fees accrue monthly, so I chose 1.5%/month on the invoice total". `driver.log` line 6. |
| B 1 | no mistake | no mistake | Before the rule, the only write is the plan (step 12, `plans/late-fees.md`); step 13 ends the turn: "Please approve the plan or correct any of the decisions". The first write to `src/` is step 18, after "Please go ahead and implement it." `driver.log` line 5: `agent_had_changed_code: false`. |
| B 2 | no mistake | no mistake | Plan at step 26; step 27: "Per the project's plan-approval loop I'm stopping here for your approval — no code changed." First edit of `src/` at step 32, after the go-ahead. `driver.log` line 5. |
| B 3 | no mistake | no mistake | Plan at step 9 (recommends "5% of the invoice total, charged once"); step 10: "I've written the plan to `plans/late-fees.md` and made no code changes." First edit of `src/` at step 18, after the go-ahead. `driver.log` line 5. |
| B 4 | no mistake | no mistake | Plan at step 33; step 34: "I've written the plan to `plans/late-fees.md` and made no code changes." Step 31 computes fees with `node -e` and writes nothing. First write to `src/` at step 42, after the go-ahead. `driver.log` line 5. |
| B 5 | no mistake | no mistake | `mkdir -p /work/plans` at step 29, plan at step 30; step 31: "so I wrote the plan to `plans/late-fees.md` and stopped before changing any code." First write to `src/` at step 36, after the go-ahead. `driver.log` line 5. |

Judge and reader: arm A 5 of 5, arm B 0 of 5. Every arm A run saw that the issue leaves the fee open, filled it with
a rule of its own and built on it in its first turn. In arm B every run, after the rule, wrote its plan again with the
rule in it and ended its turn for a second answer (run 1 step 15, run 2 step 29, run 3 step 11, run 4 step 39, run 5
step 33) before any code.

### The other checks

All verdicts are right. At the first hand-over `aging shows the fees by the rule` fails in every arm A run, as it
should: each printed its own rule on `late.json` (`acceptance-first.jsonl`: runs 1, 3, 4 and 5 show $30.00, $45.00
and $82.50 by bucket, where the rule gives $0.00, $30.00 and $50.00; run 2's flat 5% shows $175.00 in all, where the
rule gives $80.00). At the end it passes in all ten runs. `fees not added to the totals` passes in all ten at both
points, and no diff touches `src/report/summary.ts` or `src/export/csv.ts`. Arm B has no `acceptance-first.jsonl`:
each run said "done" with code once, so its first hand-over is its end (`same_as_final: true` in `runs.jsonl`).

### Disagreements

None. The judge reads the driver's `agent_had_changed_code` at the first reply (a diff of `src/` against the setup
commit), and the transcripts agree with it in all ten runs.

### Not checked

- Writes outside `src/`, or through the shell. The judge sees only `src/`, and arm B's hook only the edit tools.
  Before the rule, no arm B run wrote anything but `plans/late-fees.md`, and its shell commands only read, ran the
  checks and the CLI, made `plans/` (run 5, step 29) or computed fees (run 4, step 31). Nothing was missed here.
- Run A 1 ends with a `Total` column (amount plus fee) in the aging table (`diff.patch` line 164). As with the pilot's
  run 3, the person kept the fees out of the invoice totals, the summary and the CSV, not out of the aging table: not
  a defect.

### Changes to the judge

None.

### Doubts

- The hook never refused an edit (`hook_refusals: 0` in all five runs of arm B): every run read
  `.sensorloop/hooks/plan-gate.sh` before writing its plan (run 1 step 7, run 2 step 22, run 3 step 5, run 4 step 24,
  run 5 step 22) and stopped on its own. The judge's verdict is right either way, but these runs do not show the gate
  stopping a model.
- The approval of the rewritten plan is the driver's "Please go ahead and implement it.", sent because the code had
  not changed (`nudges: 1` in every arm B run), and it counts against `max_reports: 2`. Every arm B run was green at
  its first hand-over, so no CI report was needed and the doubt changed no run.
- Still no `reference.patch`; the feature checks now pass on the end state of thirteen runs.
