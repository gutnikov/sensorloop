---
title: Eval runner
summary: Runs a suite of cases against a prompt, a model or an agent many times, and scores each case's assertions.
sensors: [eval-set]
layer: project
---

An eval runner runs a suite of cases against a prompt, a model or an agent, repeats each case, and scores its
assertions. The suite and the runner the project already uses are found in the project rather than assumed.

## Finding it

- **A suite in the repository**: a config such as `promptfooconfig.yaml`, or a folder of cases with their expected
  answers.
- **The task file or the CI job** that runs it, and the budget it is given.
- **For an agent**, the agent's headless mode (`claude -p`), which a script runs once per case.

When there is none, ask a person before building one: a suite costs money on every run.

## Using it

- **Repeat each case** several times, since model output varies from run to run.
- **A fresh environment per run**, so one run's leftovers cannot help the next.
- **Paired arms**: the same cases with and without the change, on the same model version.
- **A budget for model calls**: cases times repeats times cost, with a cap the run stops at.

Examples: promptfoo, headless runs of the coding agent (`claude -p`), `claude plugin eval`.
