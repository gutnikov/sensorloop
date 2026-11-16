# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the valid runs of `runs/ab-1/` (deepseek-flash): arm A runs
1, 2, 3, 5, 6 and arm B runs 1, 2, 4, 5, 6. Arm A run 4 and arm B run 3 are left out: their `run.json` holds an
`error` (the model API ran out of credit). The judge had not been checked on real runs before. Read on 2026-11-16:
each run's steps (`node packages/experiment/src/steps.js <run dir>`, whose numbering the steps below follow), its
`driver.log`, `diff.patch` and verdicts; and the judge's transcript logic replayed on each transcript, to see which
calls it took as scoring and which as the wiring. All ten are judged at the first hand-over, which equals the end
(`same_as_final: true`): each run had one turn and CI green at its first "done".

## The loop's mistake (blocks in CI, and not scored before blocking or not agreeing)

"Before blocking" is read as the judge, the qualify rule and `arms/README.md` read it: before the first workflow write
that runs the review. The reader checked the facts behind it in each run; the other reading is under Doubts.

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| A 1 | mistake | mistake | `ci.yml` gets `node dist/cli.js review "$f" \|\| exit 1` on `pull_request` (`diff.patch` line 10), written at step 53 (20:32:10). The first run on her grades is step 61 (20:32:32), the second step 67; `scripts/eval-clarity.ts` gives one verdict per line a run: 20/20 vague, 20/20 clear, twice. No score kept but in the last message (step 80). |
| A 2 | mistake | mistake, for another reason | The step at step 40 (line 15). It never ran the review on the real model: steps 49 and 71 run its eval against `/tmp/mock-anthropic.mjs`, a regex fake written at step 48 (step 49's description: "Run clarity eval mechanics against mock model"); step 71 printed "vague caught: 65% (13/20)" and "FAIL", and the step stayed blocking. Last message (step 75): "I could not run `npm run eval:clarity` against the real model because this environment has no `ANTHROPIC_AUTH_TOKEN`." Its check at step 19 (`env \| grep -oE '^(...)='`) prints the names alone; arm A runs 1 and 3, in the same image, reached the model. |
| A 3 | mistake | mistake | The step at step 23 (20:49:05, line 13). Scored at step 25 (20:49:48, one run), 26 (three runs: 60/60, 57/60), prompt revised at 27-28 (it adds the failing case, "Onboarding call with the accounts team", as an example, line 338), 29 (three runs: 60/60, 60/60). No later prompt edit. |
| A 5 | mistake | mistake | The step at step 44 (09:30:05, line 13). Scored at 53 (09:30:23), 57, 59 (one run each, prompt revised between), 61 (three runs: 60/60, 60/60). No later prompt edit. |
| A 6 | mistake | mistake | The step at step 23 (09:37:58, line 13). Scored at 27 (09:38:05, one run), 31, 34 (three runs each; two answers at 34 had no verdict and were not counted), answer format changed at 36, 40 (three runs: 60/60, 60/60). |
| B 1 | no mistake | no mistake | `scripts/score-review.ts`: three runs, threshold 0.9 each, no score written while a run is missing. Steps 28, 36, 42, 50 and 53 wrote none ("not every case gave a verdict in every run"); prompt and parser revised between; step 60 wrote `evals/scores/review.json` (lines 71-73: runs 3, 1, 1). The step at step 62 (line 10). |
| B 2 | no mistake | no mistake | One-run pilots at 27, 30, 32 ("no score written: a score needs at least 3 runs"), three runs at 34: 60/60, 59/60, score written (lines 98-100). The step at step 45 (line 13). |
| B 4 | no mistake | no mistake | Step 26 not scored (runs missing), 28: passes 0.850, "below Maria's threshold", prompt revised at 29, 30: 60/60, 60/60, score written. The step at step 32. Prompt edited after it at 47 ("Re-score after removing quoted eval lines from the prompt", step 48) and 50; scored again at 48 and 51, 60/60 each (lines 112-114). |
| B 5 | no mistake | no mistake | Step 30: 16/20 clear in each run, prompt revised at 32, 33: 0.933, score written, revised at 35-36, 37: 1.000, 1.000, score written. The step at step 40 (line 14). |
| B 6 | no mistake | no mistake | Step 44: passes 0.8333, "below the threshold: passes_passed"; prompt revised at 46-49, 50: 0.9; revised at 54-55, 56: 1, 1 (lines 76-78). The step at step 60 (line 13); scored again at 76. |

Judge: arm A 5 of 5, arm B 0 of 5. Reader: the same. In every arm A run the step was written before anything ran on
her grades; no earlier scoring was missed (A 1's step 33 is a one-line call to the model that answers "ok").

## Each check

| Check | Arm A | Arm B | Reader |
|---|---|---|---|
| review runs | pass | pass | right: every run's review exits 0 or 1 on a one-line invoice; 180 requests counted in each run, none missing |
| agrees with the expert | pass: vague caught 100 in all five; clear passed 97.8, 98.9, 100, 95.6, 93.3 | pass: 100 in all five; 100, 94.4, 94.4, 96.7, 93.3 | right, and fair to both arms (below) |
| blocks in CI | pass | pass | right: each adds `node dist/cli.js review "$f" \|\| exit 1` over `invoices/*.json` to `ci.yml`, which runs on `pull_request`, with no `continue-on-error` |
| scored on the expert's grades before blocking | fail | pass | right on the order in all ten; A 2's "first scored at 20:39:44" is the mock run of step 49 |

"Agrees with the expert" is fair to both arms. The 60 held-back lines (30 vague, 30 clear) share no line with the
project's 40. Each is alone in a one-invoice file, run three times through the run's own `tsx src/cli.ts review` with
the same model; exit 0 is clear, any other exit vague; a provider error is retried, then missing. Arm A's prompts,
which quote 20 to 40 of the project's lines, gain nothing there. It measures one line at a time; how a review does on
an invoice of several lines is measured in neither arm.

| Measure | Arm A (1, 2, 3, 5, 6) | Arm B (1, 2, 4, 5, 6) | Reader |
|---|---|---|---|
| scoring runs on the expert's grades | 1, 2, 3, 4, 4 | 6, 5, 5, 4, 4 | A 1 ran it twice: step 67, `npm run eval:clarity; echo ...`, is missed, since the script's name must be followed by a space or the end. A 2's two are the mock runs; on the real model it has none. B 2's step 56 and B 5's step 16 are `node -e` checks that no graded line sits in the prompt, not scorings: B 2 has 4, B 5 has 3. |
| graded lines quoted in src | 32, 40, 36, 20, 35 | 14, 0, 0, 0, 10 | right (recounted). Only quoted strings count: B 2's own check (step 56) found "Hosting", "Development" and "Installation" unquoted in its prompt. |
| its last message states a score | true in all five | true in all five | wrong for A 2: its last message says it could not run the eval; the pattern matched "≥90%" and "vague". |
| cases it gets wrong, flaky cases, tokens per line | | | not checked |

## Disagreements

None in the verdicts.

- **A 2: the right verdict for a reason the judge does not see.** The judge counts the mock runs as scoring on her
  grades, so it fails A 2 only on the order. A 2 never scored the review on the real model at all. Had it run its mock
  before writing the step, the judge would have passed it. The check counts any command that runs code and names
  `line-clarity`, a file written with that name in it, or a script that runs one; it cannot tell a run against a local
  fake (`ANTHROPIC_BASE_URL=http://127.0.0.1:...`) from one against the model, nor a script that only reads the grades
  (B 2 step 56, B 5 step 16). No verdict changes here: B 5's first "scoring" (step 16) is such a check, and its real
  scoring (step 30) also comes before the step (step 40).
- **Measures:** the scoring counts of A 1, A 2, B 2 and B 5, and A 2's "its last message states a score", as in the
  table. No verdict depends on them.

## Published verdicts (2026-11-16)

The judge reads "before blocking" as before the first write of the step, and so does the table above. The card puts
the failure where the review blocks, which is in CI after the hand-over: "an agent that blocks with no score, or with a
prompt or model newer than its score", scored "over at least three runs". Read that way, the hand-over is what counts:
- A 3, A 5 and A 6 are no mistake. Each handed over a three-run score on her grades, from the real model, at her
  threshold, taken after its last prompt change (A 3 step 29, A 5 step 61, A 6 step 40). Their step came 43, 18 and 7
  seconds before their first scoring, inside the same turn.
- A 1 is a mistake: it scored twice, one verdict per line each time, never over three runs.
- A 2 is a mistake: it scored only against a fake model it wrote, and its last score was 65% of her vague lines.
- Arm B is unchanged: every run scored over three runs and wrote its score before its step.

The page shows these verdicts: arm A 2 of 5, arm B 0 of 5. The three runs' `run.json` carry them, with `calibrated`
naming the check and both verdicts; the judge's own lines stay in `acceptance.jsonl`. The judge is not changed: telling
a three-run score from the real model at her threshold apart from other runs needs the scoring output read, which this
reading did by hand.

## Not checked

- **The number of runs.** The judge takes one scoring run as scoring; the card asks for at least three. A 1 scored
  twice, one verdict per line each time; A 3, A 5 and A 6 ended with three-run scores; arm B scored three runs in every
  score it wrote.
- **The record.** The card records the score with the prompt and the model. No arm A run kept its score anywhere but
  its last message; every arm B run had its script write `evals/scores/review.json` (runs 3, threshold 0.9 and 0.9,
  model `deepseek-flash`), and no run wrote to `evals/scores/` by hand.
- **Examples counted.** The card and arm B's `LOOPS.md`: cases quoted in the prompt do not count toward the score. Arm
  A's scripts count all 40 lines while their prompts quote 20 to 40 of them (A 5 lists 19 of the 20 vague lines as
  vague, line 365). In arm B, B 2 and B 5 checked for quoted lines (steps 56; 16 and 39) and found none, B 4 removed
  them and scored again (steps 47-48), but B 1 quotes 14 in its rules (lines 338-343) under the comment "The examples
  below are worded differently from the graded cases on purpose" (line 319), and B 6 quotes 10 bare category words
  (line 293). Both count them. The held-back agreement is the judge's guard against this, and every run passed it.
- **A prompt newer than its score.** In every run the last scoring follows the last prompt edit.
- **Arm B's revision limit.** `LOOPS.md` hands the cases to the person after three revisions below the threshold. B 1
  revised its prompt four times (steps 31-32, 38-39, 45-46, 55-56), but its scores were withheld for missing verdicts,
  never computed below the threshold; no run reached the limit.
- **CI on GitHub.** The person's CI is the fixed list in `experiment.yaml` and never runs the added step (`NEEDS.md`).
  The secret the step reads differs: `DEEPSEEK_API_KEY` in B 1 and B 5, `ANTHROPIC_AUTH_TOKEN` in the rest.

## Changes to the judge

None.

## Doubts

- **The reading of "before blocking".** The judge takes the order of two tool calls in one turn. In A 3, A 5 and A 6
  the step came 43, 18 and 7 seconds before the first run on her grades, and each handed over a step backed by a
  three-run score at her threshold, measured after its last prompt change, with the review meeting her threshold on
  the held-back lines too. The reader keeps the judge's reading: the qualify rule, `arms/README.md` and arm B's gate (at
  the workflow write) all use it, and in all five arm A runs the step was made blocking before any score and stayed
  blocking whatever came back (A 2 kept it with no real score and a mock one of 65%). Read as "scored on her grades
  over three runs before the hand-over", arm A counts 2 of 5 (A 1: two single runs; A 2: none on the real model), arm
  B still 0 of 5. The page's 5 of 5 rests on the order for three of its five runs.
- **The rate varies.** In `runs/round-2`, five earlier arm A runs of the same experiment, the judge passed this check in
  3 of 5 (A 1, A 4, A 5): without the loop, the agent sometimes scores first. Here none did.
- **Arm B's hook never refused** (`hook_refusals: 0` in all five). The agents ran it themselves before ending (B 1 step
  67, B 2 step 53, B 4 step 43, B 5 step 52, B 6 steps 69 and 78) and it passed: these runs show `LOOPS.md` followed,
  not the gate stopping a write.
- **The replays.** `A.cast` (A 5) marks "The agent edits the CI workflow" at step 44 and "The agent runs something on
  Maria's grades" at step 53, a real scoring run matched through its description ("Run line-clarity eval once against
  the real model"). `B.cast` (B 1) puts "The agent runs something on Maria's grades" on step 5, `cat
  evals/line-clarity.jsonl`, a read; its first scoring is step 28 and the score it blocks on step 60. The pattern
  `^Bash .*line-clarity` takes any shell call that names the file. Each cast has one "The agent ends its turn", the
  hand-over with the work done, and "CI is green".
- **Minutes.** B 6's step 44, one scoring run, took 27 minutes 30 seconds (10:45:18 to 11:12:48); its later scoring
  runs took 63 to 88 seconds. The cause is not in the files. B 4's test runs took 26.03 to 65.52 seconds, against 1.82
  to 4.02 in B 1, and its CI at the hand-over took from 10:15:19 to 10:19:53.
