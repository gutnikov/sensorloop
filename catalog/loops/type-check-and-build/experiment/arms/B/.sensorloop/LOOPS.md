# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npx tsc --noEmit` |
| Build | `npm run build` |

## While you work

After each edit, `npx tsc --noEmit` runs. When it reports errors, fix the code at each `file:line`, not the types and
not the checker's settings.

## Before you finish

`npm run build` runs when you end the turn, and a failure keeps you working; the same failure three times hands it to
the person. A new `@ts-ignore`, or a cast to an untyped value such as `as any`, counts as an error unless it carries
its reason on the same line.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
