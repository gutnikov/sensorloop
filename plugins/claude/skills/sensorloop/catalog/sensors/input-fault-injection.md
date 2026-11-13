---
title: Input and fault injection
type: computational
summary: Feeds the code generated inputs or broken dependencies, and reports the smallest case that makes it fail.
signal: A minimal counterexample or crashing input, or a test that fails when a dependency is slow, down or wrong.
---

Input and fault injection feeds the code generated inputs or broken dependencies, and reports the smallest case that
makes it fail. Loops read it because it finds the cases nobody wrote down.

## What it sees

How the code behaves on inputs and failures no one chose by hand. Its forms include property-based tests, fuzzing
guided by coverage (often with runtime checks for memory errors), a fault proxy between a service and its
dependencies, chaos experiments on a running environment, and a throttled CPU. It sees only the inputs it generated
and the faults it injected: a run that finds nothing says little about the cases it did not reach.

## Reading the signal

- **No failure found**: nothing generated or injected broke the code within the run's budget. This is evidence, not
  proof.
- **A counterexample**: the minimal input that breaks a property, or an input that crashed the code. Its seed or the
  saved input reproduces it.
- **A failure under a fault**: a test that fails when a dependency is slow, down or wrong.

A minimised failing input becomes a regression test. A failure of the harness itself, such as a proxy that did not
start or an environment that was unhealthy before any fault was injected, says nothing about the code.
