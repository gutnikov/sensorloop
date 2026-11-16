# Arm B: the project with the loop

Built by hand from the card (`catalog/loops/llm-evals/card.md`): the loop is not in the plugin's `wiring/`, so this is
what the sensorloop skill would set up following the card's "The loop", "Case results" and "Set up", in the shape it
gives a project (`procedures/loops-file.md`) and in `check.sh`'s conventions. The driver does not copy this file into
the project.

## What it adds

| File | What it is |
|---|---|
| `.sensorloop/hooks/evals.mjs` | The evals before the turn ends. When `src/categorize/`, `src/cli.ts`, `scripts/eval.ts` or the package files changed since the baseline was stored, it runs the project's eval set three times (`npm run eval -- --runs 1`, each a run of all 20 cases, in parallel) and compares the mean pass rate with the baseline. Within the baseline's spread, it passes. Below it, it runs the set four more times and judges each case that failed as the card does: two passes make it noise, three failures a regression, or pre-existing when the baseline failed it too. A regression fails the turn (exit 2, `sensorloop: evals failed (...)`, one line per failed case with its reruns and why, then the pass rate against the baseline). A run the API failed is missing, never a failure; more than 10% missing withholds the comparison, which is not a pass. A change to `evals/` (the cases or the baseline) is refused: only a person's review changes them. The same files are not evaluated twice (cached by the diff's hash). Three failing rounds in a row hand over to the person. `--baseline` measures a baseline for a person to commit. |
| `evals/baseline.json` | The baseline, measured on the base commit (`ea45738`) with `--baseline` on 2026-11-15: three runs, 20/20 each, pass rate 100%, spread 0. |
| `.claude/settings.json` | The Stop hook, `node "$CLAUDE_PROJECT_DIR"/.sensorloop/hooks/evals.mjs --hook`, timeout 600 s (without `--hook`, the agent runs the same comparison by hand). |
| `.sensorloop/LOOPS.md`, `.sensorloop/loops.yaml` | The loop as the skill writes it down: what triggers the evals, what fails, what to fix (the prompt or the settings, never the cases, the baseline or how the runner grades), that `npm run eval` must run the request the command makes, missing and withheld runs, the hand-over. |
| `CLAUDE.md.append`, `.gitignore.append` | The import line `@.sensorloop/LOOPS.md`, and `.sensorloop/state/`. |

The image is unchanged: the hook needs Node and the project's own `npm run eval`, and calls the model with the
session's settings (`ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`), which the hook inherits.

Left out of the card: the CI job and the nightly run on main that decide the stable cases (no CI and no API key in CI
here); the judge model (every case of this suite is graded by code). Every case counts as stable.

## Proved without a session

2026-11-15, in a container of the experiment's image (`--arm B --runs 0`), with the DeepSeek key passed to the container
and the session's model settings. The baseline measured on the base commit, then the overlay applied as the driver
does (copied into `/work`, `.append` files appended, hooks made executable, one commit as `node`), then each state
below made in the work tree and the hook run as Claude Code runs it (`{"hook_event_name":"Stop"}` on stdin, as `node`
in `/work`; the hook then took the event from stdin, it now takes `--hook`, checked again below).

```
## Measuring the baseline on ea45738 (16 s)
{"command":"npm run eval -- --runs 1","cases":20,"runs":[{"passed":20,"total":20},{"passed":20,"total":20},
 {"passed":20,"total":20}],"pass_rate":100,"spread":0,"failing_cases":{},"missing":0}
## Stop, nothing changed                                                   exit=0 (no model call)
```

**The mistake** (`hidden/mistake.patch`): a cheaper `categorize`. The prompt cut from 53 lines to 13 (the definitions
condensed, the rules and the examples gone, "e-learning seats" no longer under Training) and its notes replaced by a
bare JSON list, and thinking turned off. Its tests and type check pass.

```
## Stop, the cheaper prompt with thinking off (19 s)
sensorloop: evals failed (the pass rate fell below the baseline by more than its noise, and 3 case(s) regressed). Fix
the prompt or the model settings so that these cases pass again; never the cases, the baseline or how the runner
grades. Reproduce with `npm run eval`.
support-month: regression: failed 2/3, then 4/4 more: no JSON list of categories in the answer: Support
warranty: noise: failed 2/3, then 2/4 more: no JSON list of categories in the answer: Support
e-learning: regression: failed 3/3, then 4/4 more: "E-learning seats, 25 users": Software, expected Training | no JSON
list of categories in the answer: Software
on-call: regression: failed 3/3, then 4/4 more: no JSON list of categories in the answer: Support
starter-kit: noise: failed 1/3, then 0/4 more: no JSON list of categories in the answer: Hardware
pass rate 81.7% (runs 80, 85, 80), baseline 100% (runs 100, 100, 100), noise 0 points
exit=2
## Stop again, the same files (0.1 s, no model call)                       exit=2, the same message
## a third failing round
{"systemMessage":"sensorloop: evals: the pass rate fell below the baseline by more than its noise, and 3 case(s)
regressed, for 3 rounds in a row; over to you. Hand the person the failed cases with their outputs."}   exit=0
## a change to the eval set (a new evals/extra.jsonl)
sensorloop: evals failed (the eval set or its baseline changed: evals/extra.jsonl). The cases, the baseline and the
threshold change only through a person's review. Put them back (`git checkout 1ab7eaf -- evals/`, and remove new files
there), and tell the person what you would change and why.                                             exit=2
```

**The reference** (`hidden/reference.patch`: the notes dropped from the prompt, `maxTokens` 1024):

```
## Stop, the reference (16 s)
{"systemMessage":"sensorloop: evals pass: pass rate 100% (runs 100, 100, 100), baseline 100% (runs 100, 100, 100),
noise 0 points"}                                                                                       exit=0
```

Checked again once the hook took `--hook` (the image rebuilt, no model calls): nothing changed, exit 0; a new
`evals/extra.jsonl`, refused (exit 2) with `--hook` and by hand alike; by hand with an open pipe on stdin, it does not
wait for it.

A first, milder mistake (the same short prompt, thinking left on) did not lose a case: 96.7% (100, 95, 95) in one
measurement and 100% in the next. A drop of two case runs in sixty, not repeated, is the noise the reruns are there to
clear; that patch is not the one kept.

The proof made about 440 requests of `categorize` (the baseline 60, the milder mistake 120, the mistake 140, the
reference 60), each the size of one `npm run eval` request: about seven runs of the eval set, which the project's
README prices at a few cents each.
