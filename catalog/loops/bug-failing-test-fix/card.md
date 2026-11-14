---
title: A bug starts with a failing test
summary: The agent turns a bug into a test that fails for the bug's reason, changes the code until it passes, and runs the whole suite.
sensors: [test-runner]
when: On every bug fix, before the code is changed and again after.
failure: No test reproduces the bug, the test passes before the fix, the original reproduction still fails after it, or another test breaks.
next: The agent rewrites a test that does not fail before the fix, then changes the code, never the existing tests, until the new test, the original reproduction and the whole suite pass. It stops and shows a person the reproduction and its last output when no test can catch the bug the way it happens, when an existing test asserts the buggy behaviour, or when the tests are still red after three rounds.
---

## The loop

1. The agent reproduces the bug on its reported symptom, and shrinks the reproduction until every part of it is
   needed. It finds the cause before it changes anything.
2. It picks the seam: the place where a test exercises the bug the way it happens at the call site. A test at a
   shallower seam passes while the bug stays. For example, when a total comes out wrong because checkout passes a
   discount to the price function in the wrong unit, a test of the price function alone passes; the test goes
   through checkout.
3. It turns the reproduction into a test at that seam, and watches it fail for the bug's reason. A test that passes
   before the fix does not reproduce the bug, and is rewritten before the code is touched.
4. It changes the code, not the test, until the test passes.
5. It runs the original reproduction again: shrinking it can drop a second cause, and then the small test passes
   while the reported bug remains.
6. It runs the whole suite. A fix that turns the new test green and another one red is not done. When the red test
   asserts the buggy behaviour itself, the agent stops and shows it to a person, who decides whether it changes.
7. The test stays in the suite, and the commit message names the cause that turned out to be right.

This is red, then green, applied to a bug.

Some bugs no automated test can catch the way they happen: a flaky one, one that depends on the environment, one
that shows only in production. The agent then says so in the task, reproduces the bug with a script, and shows a
person the reproduction. The fix is proved only once it is released, when the release is confirmed in production.

## Why

A fix with no test that reproduced the bug is a guess: nothing shows that the bug was there, or that the change
removed it. A test that fails before the fix and passes after it shows both, and it stays in the suite, so a later
change that brings the bug back the same way fails it.

## Set up

- **The steps in the agent's instructions**: write a test that reproduces the bug and fails, then fix the code; run
  the original reproduction and the whole suite before saying it is done.
- **The other tests are not the agent's to change.** During a fix, a hook refuses its writes to existing tests; only
  the new test is its own.
- **Wiring.** The agent runs the suite and the reproduction in its session, and a hook before the turn ends keeps it
  working while either is red, unless it has handed the bug to a person in the task.
