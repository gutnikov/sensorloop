---
title: Red, then green
summary: A change in behaviour starts with a test that fails for the right reason, and ends when that test and the rest of the suite pass.
sensors: [test-runner]
when: Before the code for a new behaviour or a fix is written, and again after it.
failure: The new test passes before the change, fails for a reason other than the missing behaviour, or any test fails after the change.
next: The agent changes the code, never the new test, and runs the tests again. When the test cannot be made to fail for the right reason, or the same failure keeps coming back, it stops and shows a person the test.
---

## The loop

1. Write a test for the behaviour the change should add or fix.
2. Run it and watch it fail. Read the failure: the test must fail because the behaviour is missing (its assertion
   does not hold), not because of a typo, an import error or a broken fixture.
3. Make the smallest change to the code that makes the test pass.
4. Run the whole suite. The new test, and every test that passed before, must pass now.

## Why red first

A test that has never failed has not been shown to detect anything. Seeing it fail for the right reason is what
makes its later pass mean something.

## Where it does not apply

Changes with no behaviour to state as a test: formatting, documentation, a rename done by a tool. There the loop has
nothing to read, and another sensor (the type checker, the linter) does the checking.
