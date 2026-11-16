# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |

## While you work

Before each commit, `npm run lint` runs, and a violation refuses the commit: fix the cause, as the rule's message
says. A suppression needs its reason on the same line (`// eslint-disable-next-line <rule> -- <reason>`); never raise
a limit or disable a rule to get a commit through.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
