---
title: Run the tests first
summary: Before changing anything, the agent runs the whole suite and keeps the result, so it never takes an old failure for its own regression.
sensors: [test-runner]
when: At the start of a task, before any change; and at its end, compared test by test with that first run.
failure: A test that passed in the first run fails now. A test that already failed is reported, and not counted against the change.
next: The agent fixes its regression and compares again. A main branch that is already red is reported to a person before the work starts, as a problem of its own.
---

## The loop

1. Before any change, the agent runs the whole suite with a report per test, and keeps it as the baseline.
2. It does the work.
3. It runs the suite again and compares test by test:
   - **passed before, fails now**: its regression, and it fixes it;
   - **failed before, still fails**: not its doing; it names the test in its report and leaves it, unless the task is
     to fix it;
   - **a known flaky test fails**: it is retried, and counts as a failure only if every retry fails.

## Why

An agent that has not run the suite before it changes anything cannot tell the failures it caused from the ones
that were already there. It then spends time on tests it did not break, or takes a real regression for an old
failure. One run before the change gives it a baseline to compare with.

## Set up

- **One command runs the suite and writes a report per test** (JUnit XML is the common format), written down where
  the agent reads its instructions.
- **A green main branch.** When the baseline on a clean checkout of main fails, the agent reports it before it starts.
  Those failures are a problem of their own, not part of its task.
- **A list of known flaky tests** in the repository, with retries for them alone. The agent cannot add to the list: a
  person reviews every addition.
- **A suite too slow to run whole**: the agent's baseline is the tests of the area it will change, and CI compares
  the rest with the last full run of the main branch.
- **Out of the agent's reach.** In CI the comparison is with the run on the base commit, which the agent cannot
  change, so a regression cannot hide in its own baseline.
