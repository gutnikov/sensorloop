---
title: A bug starts with a failing test
summary: The agent turns a bug into a test that fails for the bug's reason, changes the code until it passes, and runs the whole suite.
sensors: [test-runner]
placement: inner
when: On every bug fix, before the code is changed and again after.
failure: No test reproduces the bug, the test passes before the fix, the original reproduction still fails after it, or another test breaks.
next: The agent rewrites a test that does not fail before the fix, and changes the code, never the existing tests, until all of it is green. When no test at a real seam can catch the bug, it says so in the task and shows a person the reproduction instead.
---

## The loop

1. The agent reproduces the bug on its reported symptom, and shrinks the reproduction until every part of it is
   needed. It finds the cause before it changes anything.
2. It picks the seam: the place where a test exercises the bug the way it happens at the call site. A test at a
   shallower seam passes while the bug stays.
3. It turns the reproduction into a test at that seam, and watches it fail for the bug's reason. A test that passes
   before the fix does not reproduce the bug, and is rewritten before the code is touched.
4. It changes the code, not the test, until the test passes.
5. It runs the original reproduction again: shrinking it can drop a second cause, and then the small test passes
   while the reported bug remains.
6. It runs the whole suite. A fix that turns the new test green and another one red is not done.
7. The test stays in the suite, and the commit message names the cause that turned out to be right.

This is red, then green, applied to a bug.

## Why

A fix with no test that reproduced the bug is a guess: nothing shows that the bug was there, or that the change
removed it. A test that fails before the fix and passes after it shows both, and it stays in the suite, so the same
bug cannot come back unnoticed.

## Set up

- **The instruction**, where the agent reads its instructions: write a test that reproduces the bug and fails, then
  fix the code; run the original reproduction and the whole suite before saying it is done.
- **The other tests are not the agent's to change.** During a fix, a hook refuses its writes to existing tests; only
  the new test is its own.
- **When no automated test can catch the bug** (it is flaky, depends on the environment, or shows only in
  production), the agent says so in the task, reproduces it with a script, and the proof moves to confirming the
  release.
- **Wiring.** The agent runs the suite and the reproduction in its session, and a hook before the turn ends keeps it
  working while either is red.
