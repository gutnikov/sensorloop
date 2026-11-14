---
title: Eval set
type: computational
summary: Runs an agent, a prompt or a skill many times on cases with known answers, and reports how often it gets them right.
signal: A pass rate per case and overall against a baseline or threshold, the flaky cases, and the difference between runs with and without a change.
---

Loops read an eval set wherever the work being changed is itself run by a model, where one good run proves little. An
eval set also calibrates an inferential sensor: the sensor judges cases whose right verdict is known, and a loop lets
it block only once it judges them right often enough.

## What it sees

A pass rate per case and overall, measured over repeated runs because a model's output varies from one run to the
next. Paired arms, one with a change and one without it, measure the lift the change brings. An eval set sees only the
cases in it: a high pass rate says nothing about inputs unlike them.

## Reading the signal

Two rules come before any comparison. A run that broke is not a wrong answer: count model calls that timed out,
budgets that ran out and cases that could not be set up on their own, outside the pass rate. And a difference smaller
than the spread between repeated runs of the same version is noise, in either direction.

- **At or above the threshold**: the work gets the known answers often enough, overall and per case.
- **Below the baseline by more than the noise**: the change made it worse. The cases whose rate dropped show where.
- **Flaky cases**: cases that pass on some runs and fail on others. They count either way only once more runs put
  their rate clearly on one side of the threshold.
- **Lift between arms**: what the change adds, when it is larger than the noise.
