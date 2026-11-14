---
title: Test runner
type: computational
summary: Runs the project's tests on the changed code and reports which pass and which fail.
signal: The exit code, the number of tests collected, and each failed test with its file, line and assertion message.
---

A test runner runs the project's tests: unit, integration, acceptance, contract and snapshot tests. More loops
rely on it than on any other sensor, because a test states what the code must do in a form a program can check.

## What it sees

The behaviour of the code in the cases the tests describe, and nothing else. A passing suite says the covered cases
work. It does not say the change is right, and it says nothing about cases no test covers.

## Reading the signal

- **Exit code zero**: every collected test passed.
- **Non-zero exit code**: at least one test failed, or the run itself broke. Each failure names the test, its file
  and line, and the assertion that did not hold.
- **No tests collected**: not a pass, even where the runner exits with zero. A runner that found nothing to run has
  observed nothing.

A failure that comes from the run itself (an import error, a broken fixture, a missing dependency) says nothing about
the behaviour under test. Read which kind of failure it is before acting on it.
