---
title: Eval set
type: computational
summary: Runs an agent, a prompt or a skill many times on cases with known answers, and reports how often it gets them right.
signal: A pass rate per case and overall against a baseline or threshold, the flaky cases, and the difference between runs with and without a change.
---

An eval set runs an agent, a prompt or a skill many times on cases whose right answers are known, and reports how
often it gets them right. Loops read it wherever the work being changed is itself run by a model, where one good run
proves little.

## What it sees

A pass rate per case and overall, measured over repeated runs because a model's output varies from one run to the
next. Paired arms, one with a change and one without it, measure the lift the change brings. The same method
calibrates an inferential sensor before it is allowed to block. It sees only the cases in the set: a high pass rate
says nothing about inputs unlike them.

## Reading the signal

- **At or above the threshold**: the work gets the known answers often enough, overall and per case.
- **Below the baseline**: the change made it worse. The cases whose rate dropped show where.
- **Flaky cases**: cases that pass on some runs and fail on others. They need more runs before they count either way.
- **Lift between arms**: what the change adds. A difference smaller than the spread between repeated runs is noise.

A run that broke (a model call timed out, a budget ran out, a case could not be set up) looks like a wrong answer
unless it is counted apart. Separate errors of the run from wrong answers before comparing rates.
