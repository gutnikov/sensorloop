# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| Coverage of the lines your change adds or edits | `node .sensorloop/hooks/changed-lines.mjs` |

## Before you finish

When you end the turn, the tests run with coverage, and each line of `src/` your change adds or edits that no test
runs keeps you working: the hook lists them, `file:line` and the code. Write a test that runs each one and checks what
it does, not only that it runs. Coverage counts only code a test runs in its own process, so a test that starts the
command line as another process does not count: call the function from the test. The same gaps three times in a row
hand the work to the person, with the lines and the tests you tried.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Hide code from coverage (a `v8 ignore` or `istanbul ignore` comment, an exclude in a config), or delete a test.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
