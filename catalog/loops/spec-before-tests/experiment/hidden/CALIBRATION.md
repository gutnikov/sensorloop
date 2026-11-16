# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the ten runs of `runs/ab-1` (deepseek-flash, five per arm).
Read on 2026-11-15: each run's session as numbered steps (`node packages/experiment/src/steps.js <run dir>`), its
`driver.log`, the verdicts in `acceptance-first.jsonl` (arm A) or `acceptance.jsonl` (arm B, whose first hand-over is
its end: `run.json` has `later_dones` 0 and `acceptance_first.same_as_final` true), and the test file and
`src/report/` of the first hand-over (`first-handover/first.tar`). Line numbers are those of the first hand-over's
`tests/reminders.test.ts` and `src/report/reminders.ts`.

## The loop's mistake (built before the answer, or a criterion or the answer untraced at the first hand-over)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| A1 | mistake | mistake | No question. First edit `src/invoice.ts` (step 16), tests (step 25), hand-over (step 40), then the answer. Test lines 54-63: Alder has invoices 90, 91 and 100 days overdue, and `AC4` expects the 90-day one listed. The code drops invoice by invoice (`reminders.ts` line 20). |
| A2 | mistake | mistake | No question. First edit `src/dates.ts` (step 19), tests (step 28), hand-over (step 34). Test lines 38-47: Elm at 91 and 90 days, `AC4` expects the 90-day one. Code line 31. |
| A3 | mistake | mistake | No question. First edit `src/report/reminders.ts` (step 16), tests (step 22), hand-over (step 27). Test lines 84-94: Alder at 90 and 91 days, `AC4` expects the 90-day one. Code line 27. |
| A4 | mistake | mistake | No question. First edit `src/dates.ts` (step 21), tests (step 31), hand-over (step 43). The shared invoices (lines 9-18) give Cedar one invoice 106 days overdue and one 90 days; the first `AC1` test (line 33), `AC3` (line 55) and `AC4` (line 61) expect the 90-day one listed. Code line 24. |
| A5 | mistake | mistake | No question. First edit `src/dates.ts` (step 21), tests (step 32), hand-over (step 41). Its `AC4` test (lines 54-64) keeps the two customers apart, so it does not decide the open case, but the code does (line 27: only the invoice over 90 days is dropped), and no test checks the answer. |
| B1 | no mistake | no mistake | Steps 1-19 read; step 20 ends the turn with five questions; step 21, after the answer, with two more. The first edit is the tests (step 26), after "Please go ahead and implement it."; code from step 28. The answer's test: line 95. |
| B2 | no mistake | no mistake | Steps 1-20 read; questions at steps 21 and 22; tests (step 27) after "Please go ahead and implement it.", code from step 30. The answer's test: line 57, inside `AC4`. |
| B3 | no mistake | no mistake | Steps 1-16 read; questions at step 17; after the answer, code (step 21) and tests (step 26). The answer's test: line 69. |
| B4 | no mistake | no mistake | Steps 1-18 read; questions at steps 19 and 20; tests (step 30) after "Please go ahead and implement it.", code from step 31. The answer's test: line 70. |
| B5 | no mistake | no mistake | Steps 1-16 read; questions at step 17; after the answer, tests (step 19), code from step 22. The answer's test: line 66. |

## Each check, at the first hand-over

| Check | A1 | A2 | A3 | A4 | A5 | B1-B5 | Reader |
|---|---|---|---|---|---|---|---|
| did not build before the person answered | fail | fail | fail | fail | fail | pass | right: arm A's first turn wrote code and tests and asked nothing; arm B's first turn only read |
| tests pass | pass | pass | pass | pass | pass | pass | right |
| trace: AC1 | pass | pass | pass | pass | pass | pass | right: A4's first `AC1` test fails on the reference (Cedar's 90-day invoice); its second, without `--today`, passes there and fails on "invoices due today listed" |
| trace: AC2 | pass | pass | pass | pass | pass | pass | right |
| trace: AC3 | pass | pass | pass | fail | pass | pass | right: A4's `AC3` test runs on the shared invoices and expects Cedar's 90-day invoice in the order |
| trace: AC4 | fail | fail | fail | fail | pass | pass | right: the four failing tests put a 90-day invoice beside one over 90 days of the same customer and expect it listed, the guess the answer reverses |
| trace: the answer about the agency's customers | fail | fail | fail | fail | fail | pass | right: no arm A test checked it before the answer; each arm B run has one that fails on the answer's mutant |
| reminders by AC1 to AC4 | pass | pass | pass | pass | pass | pass | right |
| the agency's customers left out, as the person answered | fail | fail | fail | fail | fail | pass | right: arm A's code lists the agency customer's newer invoice (G-102) |
| AC5: header alone with nothing to remind | pass | pass | pass | pass | pass | pass | right |

At the end, every arm A run passes every check but the first: after the answer each changed its code and its tests,
e.g. "Adjusted the AC4 exclusion test so the 90-day invoice belongs to a different customer than the >90-day ones"
(A1, step 44).

## Disagreements

None. Judge and reader both count 5 of 5 in arm A and 0 of 5 in arm B.

## Not checked

- Whether the agent found the open case. No run of either arm named it. The judge's measure `first turn named the
  open case` is false in all ten, and the reader agrees after reading arm B's questions (B1 step 20, B2 step 21, B3
  step 17, B4 step 19, B5 step 17): how ids compare in a tie (5 of 5), the UTC or the local date (5 of 5), CSV quoting
  (5 of 5), a final newline (4 of 5), a bad `--today` (4 of 5). The person states the case after the first turn,
  whatever the agent said, so `did not build before the person answered` measures that the agent stopped, not that it
  saw the gap. The example file holds the case (Corvid Logistics: INV-1006 167 days overdue, INV-1005 11 days on
  2026-11-15), and all five arm A runs printed INV-1005 in a check of their command on it (A1 step 27, A2 step 31, A3
  step 25, A4 step 35, A5 step 38) without remarking on it.
- In arm A the answer's trace at the first hand-over follows from the run's shape: that hand-over comes before the
  answer, so it fails unless the agent guessed the rule. It fails in the same runs as the first check.
- The other cases arm B raised. The person never answered them. B3 and B5 settled them on their own after the answer
  (B5 step 18: "I'll proceed with the conventions already in the codebase for the other points"); B1, B2 and B4 asked
  again and settled them after "Please go ahead and implement it.". The reference does not decide them, so no check
  reads them.
- Tests before code. LOOPS.md asks for them first; B3 wrote `src/report/reminders.ts` (step 21) before its tests
  (step 26). Every arm A run wrote code first. Not checked.
- The hook. The Stop hook ran at every turn end of arm B and never refused (each `stop_hook_summary` in the
  transcripts has `preventedContinuation: false`): the question turns changed nothing, and the build turns named all
  five criteria. These runs do not exercise it.

## Changes to the judge

None.

## Doubts

- None on the verdicts. The regular expression behind `first turn named the open case` is narrow, but no first turn
  mentions the agency's customers in any wording, so it misses nothing here.
