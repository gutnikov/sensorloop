---
title: Red, then green
summary: A change in behaviour starts with a test that fails for the right reason, and ends when that test and the rest of the suite pass.
sensors: [test-runner]
when: Before the code for a new behaviour or a fix is written, and again after it.
failure: Before the change, the new test passes or fails for a reason other than the missing behaviour. After it, the new test fails, or a test that passed before fails now.
next: Until the new test fails for the right reason, the agent fixes the test; after that, it changes the code, never the new test, and runs the tests again. When it cannot write a test that fails for the right reason, or the same failure is still there after three rounds, it stops and shows a person the test and its output.
---

## The loop

1. Write a test for the behaviour the change should add or fix.
2. Run it and watch it fail. Read the failure: the test must fail because the behaviour is missing (its assertion
   does not hold), not because of a typo, an import error or a broken fixture. A run that collected no tests has not
   failed. Until the test fails for the right reason, fix the test, not the code.
3. Make the smallest change to the code that makes the test pass. From here on, the new test does not change.
4. Run the whole suite. The new test, and every test that passed before the change, must pass now. A test that
   already failed before it is reported, and not counted against the change.

## Why red first

A test that has never failed has not been shown to detect anything. Seeing it fail for the right reason is what
makes its later pass mean something.

## Where it does not apply

Changes with no behaviour to state as a test: formatting, documentation, a rename done by a tool. There the loop has
nothing to read, and another sensor (the type checker, the linter) does the checking.
