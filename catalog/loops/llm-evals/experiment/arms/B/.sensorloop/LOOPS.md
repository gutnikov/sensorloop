# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| The eval set of `categorize` (the real model, a few cents) | `npm run eval` |
| The evals against the baseline | `node .sensorloop/hooks/evals.mjs` |

## Before you finish

When you change what decides the categories of `invoicer categorize` (the prompt, the model or its parameters, the
request or the checks on the answer: `src/categorize/`, `src/cli.ts`), the evals run when you end the turn: the eval
set three times, compared with the baseline in `evals/baseline.json`, the pass rate of the base version and the spread
of its runs. Below the baseline by more than that spread, each case that failed runs four more times: two passes make
it noise, three failures a regression (or pre-existing, when the baseline failed it too). A regression keeps you
working: read the failed cases, fix the prompt or the settings, and end the turn again. You can run the same
comparison first with `node .sensorloop/hooks/evals.mjs`; the same files are not evaluated twice.

`npm run eval` runs `categorizeLines`, the request `invoicer categorize` makes for each invoice. If the command comes
to make another request (another function, another message, several invoices at once), make `scripts/eval.ts` run
that one, so that the evals measure what ships.

A run the API failed is missing, not a failure. When too many are missing the comparison is withheld, and a withheld
comparison is not a pass: run the evals again, and if runs are still missing, tell the person. Three failing rounds in
a row hand the work to the person, with the failed cases and their outputs.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Change the eval cases (`evals/categorize.jsonl`) or the baseline (`evals/baseline.json`): only a person's review
  does.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
