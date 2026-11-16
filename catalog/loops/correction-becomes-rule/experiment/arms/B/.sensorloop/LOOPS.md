# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file. The exception is the section
"Rules from corrections" below, which grows here, one rule for each correction.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |

## While you work

When the person corrects your work (tells you that something you did should be different), first add the correction
to "Rules from corrections" below, then fix the work. One short line per correction: what to do, in the form of the
mistake it prevents and in the person's words, with the date and the issue it came from. A correction of a kind
already there makes that rule clearer; it is not a second line.

## Before you finish

Check your work against every rule under "Rules from corrections", and name the rules you applied in your hand-over.

## Rules from corrections

None yet.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
