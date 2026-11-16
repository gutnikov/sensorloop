# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| The eval set of `categorize`, against the real model | `npm run eval` |

## While you work

A check that asks a model for a verdict (a reviewer, a judge, a classifier whose answer can fail a build) is advice
until it is calibrated on an expert's grades. Before it blocks anything:

1. Its cases are the expert's grades of real results, each pass or fail with why (`evals/`). A few may go into its
   prompt as examples; those cases do not count toward its score.
2. Run it on every case at least three times, with its real prompt, on the model it uses. A run that errored is
   missing, not a verdict.
3. Score it, each rate apart: the share of the expert's fails it also fails, and the share of her passes it also
   passes. Raw agreement hides a check that passes everything.
4. Compare each rate with the threshold the person set, as they gave it. Below it, revise the prompt from the cases it
   got wrong and score it again; never lower the threshold or drop cases. After three revisions still below it, stop
   and give the person the cases it gets wrong, with its scores.
5. A scoring script, kept in the repository, writes the score to `evals/scores/<check>.json`; never write that file
   by hand:

   ```json
   {
     "check": "<the word its CI step runs it by>",
     "cases": "evals/<the graded cases>.jsonl",
     "runs": 3,
     "fails_caught": 0.95,
     "passes_passed": 0.92,
     "threshold": { "fails_caught": 0.9, "passes_passed": 0.9 },
     "model": "<the model it was scored on>",
     "scored_at": "<date>"
   }
   ```

Only then may a CI step fail the build on its verdict. Until then, the step runs as advice (`continue-on-error: true`)
or not at all. A new prompt or model is scored again before it blocks again.

## Before you finish

A hook guards the CI workflows. When a write to `.github/workflows/`, a `git commit`, or the end of your turn would
leave a step that asks a model and can fail the build, it looks in `evals/scores/` for the score of the check that step
runs: at least three runs, both rates at or above their thresholds. Without one, it refuses and says what is missing.
It also refuses writes to `evals/scores/` by hand. The same failure three times at the end of a turn hands it to the
person.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
