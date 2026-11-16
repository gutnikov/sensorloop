# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the 10 runs of the A/B `ab-1` (`runs/ab-1/A-deepseek-flash-1`
to `-5` and `B-deepseek-flash-1` to `-5`, deepseek-flash), judged at the first hand-over. Read on 2026-11-15: each
run's session (`steps.js`), its `driver.log`, the snapshot of its first hand-over (`first-handover/first.tar`), its
verdicts (`acceptance-first.jsonl`, `acceptance.jsonl`) and its diff. Step numbers are those of `steps.js`.

In arm A the first hand-over is the end of the first turn, before the product owner speaks. In arm B the first turn
ends with a question and no code, which the driver does not count as a hand-over, so the first hand-over is the end of
the second turn, after the product owner's message; it is also the end of the run (`same_as_final`).

## The loop's mistake (`no first build that misses the criteria` or `a test names FB-112` fails)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| A1 | mistake | mistake | Code before the product owner spoke (`driver.log` line 6, `agent_had_changed_code: true`). The first build appends a `By customer` table to every aging report (`first.tar`, `src/report/render.ts` line 44) with no option (`src/cli.ts` line 27), so `aging` without `--by-customer` no longer prints what it printed (criterion 4). Test `FB-112: ...` already there (`tests/aging.test.ts` line 30, steps 31-34). |
| A2 | mistake | mistake | `driver.log` line 6. The customer table is always printed, and "No overdue invoices." when none is overdue (`render.ts` lines 35-40); no option in `cli.ts` line 27. FB-112 test at `tests/aging.test.ts` line 24 (steps 16-17). |
| A3 | mistake | mistake | `driver.log` line 6. Customer table or "No overdue invoices." under every report (`render.ts` lines 34-40); no option. FB-112 test at line 24 (step 31). |
| A4 | mistake | mistake | `driver.log` line 6. `By customer` table whenever a customer is overdue (`render.ts` lines 35-41); no option. FB-112 test at line 24 (steps 27-28). |
| A5 | mistake | mistake | `driver.log` line 6. `By customer` table whenever a customer is overdue (`render.ts` lines 35-45); no option. FB-112 tests at `tests/aging.test.ts` line 24 and `tests/render.test.ts` line 19 (steps 27-28). |
| B1 | no mistake | no mistake | No code before the product owner spoke (`driver.log` line 5, `agent_had_changed_code: false`): steps 1-21 only read and run the report, step 22 is the draft criteria. Tests `FB-112: ...` written first (steps 30-31), seen failing (steps 32-33), then the code (step 34); `diff.patch` lines 168-226. |
| B2 | no mistake | no mistake | `driver.log` line 5. Draft at step 20; tests at step 27, failing at step 28, code from step 30; `diff.patch` lines 155-185. |
| B3 | no mistake | no mistake | `driver.log` line 5. Draft at step 23; tests at steps 29-31, failing at steps 32-33, code from step 34; `diff.patch` lines 167-240. |
| B4 | no mistake | no mistake | `driver.log` line 5. Draft at step 18; tests at steps 23-25, failing at steps 26-27, code from step 28; `diff.patch` lines 171-232. |
| B5 | no mistake | no mistake | `driver.log` line 5. Draft at step 15; tests at step 25, failing at steps 26-27, code from step 28; `diff.patch` lines 198-220. |

Judge: 5 of 5 in arm A, 0 of 5 in arm B. Reader: the same. Every arm A run made the mistake through the first check
only: each had a test named FB-112 at its first hand-over.

## Each check

At the first hand-over: arm A from `acceptance-first.jsonl`, arm B from `acceptance.jsonl` (the same moment).

| Check | Arm A | Arm B | Reader |
|---|---|---|---|
| criteria agreed before building | fail ×5 | pass ×5 | right: `driver.log`'s `first-reply`, and the transcripts agree (no Write or Edit before the product owner's message in arm B) |
| no first build that misses the criteria | fail ×5 | pass ×5 | verdicts right; arm A's reason is wrong (see Disagreements) |
| criterion 1: one row per customer, by bucket and in total | pass ×5 | pass ×5 | right by the letter. In arm A the snapshot has no `--by-customer`: the CLI ignores the unknown argument and prints the customer table it now always prints |
| criterion 2: largest total overdue first | pass ×5 | pass ×5 | right |
| criterion 3: no row for a customer with nothing overdue | pass ×5 | pass ×5 | right |
| criterion 4: aging unchanged without the option | fail ×5 | pass ×5 | right: arm A's first builds changed the default report |
| tests pass | fail in runs 2, 3, 4; pass in 1, 5 | pass ×5 | wrong for arm A runs 2, 3, 4 (see Disagreements) |
| a test names FB-112 | pass ×5 | pass ×5 | right: the snapshots' `tests/aging.test.ts` name FB-112 (arm A); `diff.patch` (arm B) |
| the FB-112 tests fail on the code before the change | pass ×5 | pass ×5 | right: arm A's turn-1 test reads `report.customers`, which the setup lacks; arm B's agents saw theirs fail |

## Disagreements

None on a verdict. Two of the judge's reasons are wrong, both at arm A's first hand-over:

- **`no first build that misses the criteria`: right verdict, wrong reason, and a latent false fail.** At the first
  hand-over the driver runs the judge on a copy, `/tmp/first` (`restoreFirst`, line 337 of
  `packages/experiment/base/driver/session.mjs`), while the transcript's paths are under `/work`. `inProject`
  (`judge.mjs` line 105) drops every path outside the project, so the rebuilt first build applies none of the agent's
  edits (`first build`: `src_edits: 0`, `options: []` in all five `acceptance-first.jsonl`): it is the setup commit.
  The check then reports criteria 1-3 missed ("no option to run") and criterion 4 met, the reverse of what the snapshot
  shows in the same file (1-3 pass, 4 fails). Any run that builds before the person speaks fails this check at the
  first hand-over, even one whose first build met every criterion. No verdict here changes: all five first builds
  changed the default report. At the end (`acceptance.jsonl`, run on `/work`) the rebuild applies the 4 or 5 edits of
  turn 1 (`exact: true`) and reports criterion 4 missed, which is right.
- **`tests pass`, arm A runs 2, 3 and 4: false fail.** The failing tests are in `tests/render.test.ts`, which these
  runs wrote after the product owner's message (run 2 step 26, run 3 step 43, run 4 step 41) and which is not in their
  snapshot (`first-handover/first.files`). The driver marks new files with `git add -A -N` in `collect` (`session.mjs`
  line 367) before `restoreFirst` copies the project, so `git clean` (line 343) keeps them. At their real first
  hand-over these suites passed: "Tests  18 passed (18)" (run 2 step 18, run 3 step 36, run 4 step 29). The check is
  not in the qualify rule. The leak also adds `tests/render.test.ts` to `tests that name FB-112` for these runs.

## Not checked

- What the draft criteria say. The judge sees whether code changed before the person spoke, not what the agent
  proposed. All 5 drafts of arm B put the customers in the default aging report (run 1 step 22, run 2 step 20, run 3
  step 23, run 4 step 18, run 5 step 15), which criterion 4 rules out; runs 1, 2 and 4 named `--by-customer` only as
  an alternative. The scripted person corrects every draft the same way, so no verdict depends on it, but a person who
  approved a draft as written would have got arm A's miss.
- What the FB-112 test tests. At arm A's first hand-over it checks the guess (`report.customers`); the check passes on
  any new or changed test file that names the id.
- The order of test and code. The judge checks that the FB-112 tests fail on the setup code, not that the agent saw
  them fail. Arm A wrote its test after the code in every run (e.g. run 4: code at steps 22-25, test at step 27); arm B
  wrote them first and ran them red.
- A `Total` row under `--by-customer` (arm A run 4, `diff.patch` line 116; arm B run 3, line 124). Criterion 1 asks for
  one row per customer; the judge finds each customer's row and ignores other lines. Not counted as a miss here.
- Changes outside the item. Arm A run 1 bumped the version to 0.5.0 in `package.json` and `package-lock.json` (steps
  36-37), unasked. Arm B runs 4 and 5 exported `main` from `src/cli.ts` to test the command in-process (step 34 in
  both).
- The hook. In arm B the Stop hook ran at both turn ends and never refused (`stop_hook_summary` with
  `preventedContinuation: false` in each transcript; `hook_refusals: 0` in `runs.jsonl`).

## Changes to the judge

- `inProject` maps paths under `/work` onto the project being judged (2026-11-15, after this calibration), so the
  first-hand-over rebuild applies the agent's edits. No verdict of these runs changes: every arm A first build broke
  criterion 4 either way, and no arm B run edited the code in its first turn.
- The driver now restores the first hand-over with the index set back to the setup commit (`read-tree`), so a file
  written after the first hand-over no longer stays in it (`packages/experiment/base/driver/session.mjs`,
  `restoreFirst`). It applies to runs made after the change.

## Doubts

- I did not run the judge or the code again. The verdicts on the criteria rest on the judge's output and on the code
  read from the snapshots and diffs.
