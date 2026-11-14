---
title: Evals on every prompt change
summary: After each change to a prompt, a tool description or the model, the agent runs the feature on a suite of cases several times, and a drop in the pass rate fails the change.
sensors: [eval-set, llm-judge]
when: After each change to a prompt, a tool description, the model or a parameter the feature uses, before the agent says it is done; in CI, on every pull request that touches one of them; and every night on the main branch, to learn which cases are stable.
failure: The pass rate falls below the threshold, or below the baseline by more than the noise (the spread of the pass rate between repeated runs of the base branch). On a pull request, only stable cases count. A case that fails on the base branch as well is pre-existing, and a run that errored is missing; neither counts against the change. A drop that only the judge's grades show is advice until the judge is calibrated.
next: The agent reads the failed cases, fixes the feature's prompt or tool descriptions and runs the evals again. A case, the baseline and the threshold change only through a person's review. After three rounds in which the pass rate does not recover, the agent stops and hands a person the failed cases with their outputs.
---

## The loop

1. The agent changes a prompt, a tool description, the model or a parameter the feature uses.
2. It runs the evals: the feature runs on every case in the suite, three times each, and every output is graded.
3. Code grades what it can: an exact value, a substring, valid JSON, a regular expression, a custom function. A
   judge grades what needs judgement, such as whether a summary is faithful to its source.
4. The evals compare the pass rate with the baseline and the threshold, and print one line per failed case,
   `<case>: <assertion>: <reason>`, then `pass rate 78% (baseline 90%, threshold 85%)`.
5. On a drop, the agent reads the failed cases, fixes the prompt or tool descriptions and runs the evals again.

## Case results

- **Flaky**: a case that passes on some runs and fails on others. The report shows it as flaky instead of averaging
  it into the pass rate, and the reruns below decide which way it counts.
- **Noise, pre-existing or a regression**: a failing case is run up to four more times. Two passes clear it as
  noise. Three failures send it to the base branch: if it fails there as well, it is pre-existing; if it passes
  there, it is a regression. Only a regression counts against the change.
- **Missing**: a run that errored or produced no grade. A provider's error, such as a 500 or a 503, is retried up to
  three times first. A missing run is never a failure or a zero, and is logged apart from behaviour. A comparison
  that includes it is withheld, and a withheld comparison is not a pass: the agent runs the evals again, and if runs
  are still missing, it tells a person instead of saying it is done.
- **Stable**: a case with results in at least five of the last six nightly runs, above 60% every night and 80%
  overall; a person may set other numbers. Only a stable case can block a pull request. Until a case has that
  history, its failure on a pull request is advice.

## Why

The output of an LLM feature differs from run to run, so one good example says little about a prompt change. A
prompt that got better on the case the agent tried can get worse on cases nobody looked at, and go out unnoticed.
Evals run the feature on a whole suite, several times, and a drop in the pass rate fails the change.

## Set up

- **A suite next to the feature**, in the repository: cases from real use, plus edge cases such as irrelevant input,
  overly long input and ambiguous requests. An eval tool runs it, such as promptfoo, DeepEval or Inspect. In
  promptfoo, one config file holds the prompts, the providers and the tests, and `promptfoo eval --repeat 3` runs
  each case three times.
- **Code before a judge.** Code is the fastest and most reliable grader, so a case gets deterministic assertions
  wherever they can decide, and a model-graded one only for the rest. The judge runs on a different model from the
  feature's, asks each yes-or-no question three times in parallel and takes the majority. It blocks only once it is
  calibrated: on cases an expert graded, its grades agree with the expert's at a rate a person approves.
- **Each case asserts what the feature did.** Where the feature is an agent with tools, a lint rejects a case with no
  positive assertion on a tool call, and a case may not restrict the tools, so it runs against the default set.
- **Each run starts clean.** A feature that acts gets a new workspace and session per run, so one run's files cannot
  help the next.
- **A baseline and a threshold.** The pass rate on the base branch, and its spread across the repeated runs, are
  stored with the suite. A person approves the threshold (in promptfoo, `PROMPTFOO_PASS_RATE_THRESHOLD`, which is
  100% when not set).
- **The failure names the fix and forbids the shortcut.** Each regression carries the command that reproduces it.
  The agent fixes the feature's prompt or tool descriptions. It changes a case only as a last resort and through a
  person's review, and never makes a case pass by editing the context file or prompt that the case supplies.
- **Wiring.** The CI job's path filter covers the files that hold the prompts, the tool descriptions, the model and
  its parameters, and the job runs whenever it cannot tell. It takes the suite, the baseline and the threshold from
  the base branch, so a case deleted or a threshold lowered in the same pull request still counts against it. A
  nightly job runs the evals on the main branch and keeps each case's results, which decide the stable cases.
  Prompts, tool descriptions and evals share one set of code owners.
