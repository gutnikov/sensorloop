# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |

## Before you change anything

Run `npm test` before changing anything, and note which tests already fail. When you finish, run it again and compare
test by test: a test that passed and now fails is yours to fix; one that already failed is not, so name it in your
report and leave it, unless the task is to fix it.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
