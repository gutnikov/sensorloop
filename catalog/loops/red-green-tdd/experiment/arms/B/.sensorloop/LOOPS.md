# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| One test | `npx vitest run <file> -t "<name>"` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |

## While you work

A change in behaviour starts with a test. Write the test, run it with `npx vitest run <file> -t "<name>"`, and see it
fail because the behaviour is missing (its assertion fails), not because of a typo or an import error. Then write the
smallest change that makes it pass, and run the whole suite with `npm test`. A bug fix starts the same way: first a
test that reproduces the bug. Change the code, never the new test, to make it pass.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
