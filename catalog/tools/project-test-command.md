---
title: The project's test command
summary: Whatever runs this project's tests, found in the project itself rather than assumed.
sensors: [test-runner]
---

The project, not the loop, chooses how its tests run. This tool is the command the project already uses, found in
the project before anything is run.

## Finding it

Look where the project itself runs its tests, in this order:

1. **CI**: the job that runs the tests on every pull request. It is the command the project trusts.
2. **The project's task file**: a `test` script, target or task in the file the project runs its tasks from.
3. **The README or the contributing guide**: the command it tells contributors to run.
4. **The test framework's default**, read off the framework the project depends on.

When these disagree, CI wins: it decides whether a change is merged. When none of them names a command, ask a person
rather than guess.

## Running all of it, or one test

- **The whole suite**: the command as found. The work counts as done only when this passes.
- **One test**, to see a single failure quickly: every framework has its own way, for example `pytest path::name`,
  `npx jest -t name` or `go test -run Name ./pkg`. Read the framework's help rather than guess the flag.
