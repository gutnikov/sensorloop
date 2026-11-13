---
title: Property-based testing library
summary: Generates inputs for a test from a description of them, and shrinks a failing input to the smallest one that still fails.
sensors: [input-fault-injection]
layer: project
---

A property-based testing library lets a test describe its inputs instead of listing them, and state what must hold
for all of them. Each language has its own, so the one in use is found in the project rather than assumed.

## Finding it

- **The dependency manifest**: the library among the test dependencies.
- **Existing tests** that use it: `@given` in Python, `fc.assert` in JavaScript, `@Property` in Java, `proptest!`
  in Rust.
- **Its settings**: the number of cases per property, and profiles for local runs and CI (Hypothesis's `settings`
  profiles, often in `conftest.py`).

It has no command of its own: property tests run with the project's test command.

## Using it

- **Reproduce a failure from its seed**: each library prints the seed or the failing case, and Hypothesis also keeps
  failing examples in its `.hypothesis` folder.
- **Keep the shrunk input as a fixed case** (`@example` in Hypothesis, or a plain unit test), so it is checked on
  every run.
- **More cases on a schedule** than on every change (`max_examples` in Hypothesis, `numRuns` in fast-check).

Examples: Hypothesis (Python), fast-check (JavaScript), jqwik (Java), proptest (Rust), QuickCheck (Haskell).
