---
title: Input and fault injection
type: computational
summary: Runs the code on generated inputs or with broken dependencies, and reports the smallest case that makes it fail.
signal: A minimal counterexample or crashing input, or a test that fails when a dependency is slow, down or wrong.
---

Loops read it because it finds the cases nobody wrote down, which a test suite written by hand cannot.

## What it sees

How the code behaves on inputs and failures no one chose by hand. Inputs come from property-based tests or from
fuzzing guided by coverage, often with runtime checks for memory errors. Faults come from a proxy between a service and
its dependencies, from chaos experiments on a running environment, or from throttling the CPU the code runs on. It
sees only the inputs it generated and the faults it injected: a run that finds nothing says little about the cases it
did not reach.

## Reading the signal

A run ends in one of four results.

- **No failure found**: nothing generated or injected broke the code within the run's budget. This is evidence, not
  proof.
- **A counterexample**: the minimal input that breaks a property, or an input that crashed the code. Its seed or the
  saved input reproduces it. Whoever fixes the bug adds that input to the tests, so the bug cannot come back unseen.
- **A failure under a fault**: a test that fails when a dependency is slow, down or wrong.
- **A failure of the harness**: a proxy that did not start, or an environment that was unhealthy before any fault was
  injected. It says nothing about the code.
