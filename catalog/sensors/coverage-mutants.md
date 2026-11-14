---
title: Coverage and mutation
type: computational
summary: "Shows what the tests do not check: lines no test runs, and changes to the code that no test notices."
signal: Uncovered changed lines as file:line; each surviving mutant with the change that survived; a score under its threshold.
---

Loops read coverage and mutation to judge the tests, not the code. Coverage records which lines run during the tests.
Mutation testing makes small changes to the code, called mutants, runs the tests against each, and reports the mutants
that no test failed on.

## What it sees

Coverage says a line ran during the tests, not that anything checked its result. Mutation testing goes further: a
mutant that survives is a change to the code that no test would notice. Coverage of the changed lines matters more
than the total, which can hide a new gap behind old covered code. Neither says whether the tests check the right
behaviour.

## Reading the signal

- **Uncovered lines**: each changed line that no test ran, as `file:line`.
- **A surviving mutant**: the change to the code that survived. Either a test lacks an assertion, or the mutant is
  equivalent to the original and no test could catch it.
- **A score under its threshold**: the share of covered lines or killed mutants fell below its floor.
- **No data**: a mutation run that stopped before it tested its mutants, or a coverage report with no data, has
  observed nothing. This is not a pass.

Mutation testing runs the tests once for each mutant, so it is slow; loops run it on the changed files or on a
schedule.
