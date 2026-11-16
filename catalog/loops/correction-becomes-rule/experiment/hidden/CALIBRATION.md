# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the ten runs of `runs/ab-1/` (deepseek-flash, five per
arm): the judge's first check against a reader. Read on 2026-11-16: each run's two sessions as numbered steps, its
`driver.log`, its `diff.patch` and its verdicts. Session 1 is the transcript that starts with "#21 Filter the reports
by customer"; its steps and session 2's are numbered as `packages/experiment/src/steps.js` numbers a transcript (that
script prints only the larger of the two files, which is session 1 in some runs and session 2 in others).

Two things were also run, outside the container, in a scratch folder, each compiled with `tsc -p tsconfig.build.json`
and run with `node dist/cli.js` on the judge's own inputs:

- **The first hand-over**: the driver's copy `first-handover/first.tar`, taken at session 1's first "done", in the
  same second as the correction (`driver.log`: `turn-end`, `first-handover`, `first-reply`, `person`). It is the code
  the person corrected.
- **The end**: the fixture `packages/experiment/fixtures/invoicer`, arm B's overlay, and the run's `diff.patch`
  (`commits.txt` is empty: nothing was committed).

The pilot (`runs/round-2/`) was not read.

## Session 1: was the correction needed?

At the first hand-over, in all ten runs, `summary data/invoices.json --customer acme` begins "Invoices 2" and names
Acme only in the row of its customer table, and `aging data/invoices.json --customer
corvid --today 2026-11-01` begins "As of 2026-11-01" and never names Corvid. The first hand-over is session 1's step
30 (A 1), 26 (A 2), 31 (A 3), 31 (A 4), 37 (A 5), 28 (B 1), 24 (B 2), 23 (B 3), 22 (B 4) and 19 (B 5); none says
which customer a filtered report covers. A 1 shows the same in its own run of the reports (step 28).

So every run needed the correction, in arm B as in arm A: each run could show the mistake in session 2.

## The loop's mistake (session 1 needed the correction, and session 2 does not name its filter)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| A 1 | no mistake | no mistake | Session 2 read `render.ts` (step 6) and turned its customer line into `coverageLines(customer, month)`, which adds `Month: ${month}` (steps 25 to 28, 34 to 36). At the end, `summary month.json --month 2026-09` begins "Month: 2026-09". |
| A 2 | mistake | mistake | Session 2 read `render.ts` (step 5), with session 1's comment "Names the customer a filtered report covers, so the printout cannot pass for the whole company's." (session 1, step 29), and added no month line. Its own run of `--customer acme --month 2026-09` printed "Customer: Acme Tools (acme)" above the figures and no month (step 25). At the end the September summary begins "Invoices 3" and never names the month. Hand-over: step 27. |
| A 3 | mistake | mistake | Session 2 read `render.ts` (step 7), weighed a month line and dropped it in its reasoning before step 16: "Decision: I'll not change the output format for --month." and "OK final: minimal, no scope line." The September summary begins "Invoices 3" and never names the month. Hand-over: step 39. |
| A 4 | no mistake | no mistake | Session 2 read `render.ts` (step 8) and added `Month: ${month}` to `scope()` (step 19); "Month: 2026-09" first. |
| A 5 | no mistake | no mistake | Session 2 read `render.ts` (step 6) and added a `Month:` line to `heading()` (steps 21, 22); "Month: 2026-09" first. The judge's value for session 1 is null (Disagreements). |
| B 1 | no mistake | no mistake | Rule written in session 1, step 31, before the first code edit (step 33). Session 2: `Month:` line (steps 18, 19); "Month: 2026-09" first; the hand-over names the rule (step 30). |
| B 2 | no mistake | no mistake | Rule at session 1, step 27; code from step 28. Session 2: `Month:` line (steps 12 to 14); hand-over names the rule (step 23). |
| B 3 | no mistake | no mistake | Rule at session 1, step 25; code from step 26. Session 2: `Month:` line (steps 24 to 26); hand-over names the rule (step 35). |
| B 4 | no mistake | no mistake | Rule at session 1, step 25; code from step 26. Session 2, step 15: "I'll follow the existing `customer.ts` pattern and apply the project rule that filtered reports state their scope."; `Month:` line (steps 17, 18); hand-over names the rule (step 31). |
| B 5 | no mistake | no mistake | Rule at session 1, step 22; code from step 23. Session 2: `Month:` line (steps 25, 26); hand-over names the rule (step 46). |

Judge: arm A 2 of 5, arm B 0 of 5. Reader: the same.

## The rule, in arm B

Each run wrote the rule under "Rules from corrections" in `.sensorloop/LOOPS.md`, after the correction and before it
changed the code, and said so first: "Per the project's loop rules, I'll record the correction as a rule first, then
fix the work." (B 1, step 29); "Adding the correction to the rules first, as the loop requires:" (B 2, step 25);
"You're right — I'll record the correction as a rule first, then fix it." (B 3, step 24); "First I'll record the
correction as the project's loop requires." (B 4, step 23); "Per the project's loop, the correction becomes a rule
first, then the fix." (B 5, step 20).

| Run | Step | The rule as written |
|---|---|---|
| B 1 | 31 | 2026-11-16 (#21): A filtered report must say at the top what it covers, e.g. "Customer: Acme Tools (acme)" above the figures, so a printout of one customer's summary never passes for the whole company's. |
| B 2 | 27 | A filtered report must say at the top what it covers, e.g. "Customer: Acme Tools (acme)", so a printout of one customer's summary never passes for the whole company's (2026-11-16, issue #21). |
| B 3 | 25 | A filtered report must name what it covers at the top, e.g. `Customer: Acme Tools (acme)` above the figures, so a printout of one customer's summary never passes for the whole company's (2026-11-16, #21). |
| B 4 | 25 | 2026-11-16, #21: A filtered report must say at the top what it covers, e.g. "Customer: Acme Tools (acme)" above the figures — a printout of one customer's summary must never pass for the whole company's. |
| B 5 | 22 | A filtered report must say at the top what it covers, e.g. `Customer: Acme Tools (acme)` above the figures, so a printout of one customer's report never passes for the whole company's (2026-11-16, #21). |

Session 2 read it in every run: its transcript's `instructions` attachment, before step 1, lists
`/work/.sensorloop/LOOPS.md` (through `@.sensorloop/LOOPS.md` in CLAUDE.md) with the rule in it, and every hand-over
names it under "Rules applied" or "Rules from corrections applied". No session 2 opened the file with Read; B 4 showed
its diff (step 13). Arm A's sessions load only `/work/CLAUDE.md`, which says nothing about filtered reports.

## Each check

| Check | Judge | Reader |
|---|---|---|
| session 1 needed the correction (value) | true in 9 runs, null in A 5 | true in all 10 (above); wrong for A 5 (below) |
| customer filter | pass in all 10 | right: Acme's $4,415.28, $3,252.48 and $1,162.80, no other customer; Corvid's aging $1,897.50 |
| unknown customer refused | pass in all 10 | right: exit 1, with a message that names `nobody` |
| month filter | pass in all 10 | right: $2,200.78, $1,200.00 and $1,000.78, without Dunlin |
| bad month refused | pass in all 10 | right: `--month 2026-9` exits non-zero and names it |
| reports unchanged without a filter | pass in all 10 | right: `summary`, `aging --today 2026-11-01` and `summary month.json` print byte for byte what the fixture prints |
| session 1 names its filter | pass in all 10 | right: the first lines are "Customer: Acme Tools (acme)" and "Customer: Corvid Logistics (corvid)" |
| session 2 names its filter | fail in A 2 and A 3, pass in the rest | right: A 2 and A 3 begin "Invoices 3"; the others "Month: 2026-09" |
| memory files | none in all 10 | right: no tool call in any session writes under `~/.claude` |
| correction kept as a rule | `project_docs` true in arm B, false in arm A; `memory` and `user_claude_md` false in all | right: arm B's rule is in `.sensorloop/LOOPS.md`; no arm A run added a rule to any `.md` |
| sessions found | 2 in each run | right |

## Disagreements

- **A 5: `session 1 needed the correction`.** The judge's value is null, "inexact replay", because of a shell edit:
  `sed -i 's/\[--customer ID\]/[--customer <id>]/g' /work/src/cli.ts` (session 1, step 36). The `sed` only changed
  the usage text. The driver's copy of the first hand-over shows the mistake like the other nine: the
  summary begins "Invoices 2" and the aging "As of 2026-11-01". Reader: true. It changes no verdict: the qualify rule
  needs this value true and `session 2 names its filter` failing, and A 5's session 2 names its month. A fix would be
  to judge session 1 from the driver's `first-handover/` copy, which is the corrected code exactly, and keep the
  replay for a run without one. Not changed: the judge is not this reading's to edit.

## Not checked

- **Both filters at once.** The judge runs `--month` alone. With `--customer acme --month 2026-09`, A 2 and A 3 print
  "Customer: Acme Tools (acme)" above a September summary and no month; the other eight print both lines.
- **What carried over in arm A.** The judge measures memory and docs, not code. Every session 1, in both arms, left
  the reason in a comment over the code that prints the customer line in `src/report/render.ts`: A 1 step 35, A 2 29,
  A 3 35, A 4 33, A 5 44; B 1 34, B 2 28, B 3 26, B 4 27, B 5 23. All five arm A session 2s read that file, and three
  extended it to the month. Arm B's 5 of 5 is the rule and the same comment together; these runs cannot separate them.
- **The rule's form.** The judge matches a line that has "filter" and a word such as "top" or "covers" in any added
  `*.md`. All five rules are in `.sensorloop/LOOPS.md`, close to the person's words, with the date and the issue
  (the arm's instruction); B 2's leaves out "above the figures".

## Changes to the judge

None.

## Doubts

- The two replays first held only session 1, with session 2's markers after its end. Since 2026-11-16 the replay
  builder (`packages/experiment/src/cast.js`) plays a run's sessions one after another, and marks session 2's task
  and its own edits; the replays were made again.
- Five runs per arm. 2 of 5 against 0 of 5 is the difference of two runs.
