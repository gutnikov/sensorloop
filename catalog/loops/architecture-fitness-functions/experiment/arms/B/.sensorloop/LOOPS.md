# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| Architecture rules | `.sensorloop/hooks/architecture.sh` |

## While you work

The layers of ARCHITECTURE.md are checked as rules: `src/report/` and `src/export/` do no I/O (no files, no network,
no clock) and do not import `src/cli.ts` or `src/parse.ts`; `src/parse.ts` is the only module that reads files; no
cycles. After each edit, `.sensorloop/hooks/architecture.sh` runs (dependency-cruiser on `.dependency-cruiser.cjs`).
Each violation prints the import, `from → to`, with its rule's text: move the code where the text says, such as
reading a file in `src/parse.ts` and passing its contents in from `src/cli.ts`, and the check runs again.

## Before you finish

The same check runs before each `git commit` and when you end the turn; a violation refuses the commit or keeps you
working. The same failure three times at the end of a turn hands it to the person.

## Ask a person first

The rules are the person's. Changing `.dependency-cruiser.cjs` or a rule in ARCHITECTURE.md is not a fix (a hook
refuses writes to `.dependency-cruiser.cjs`): when you believe a rule is wrong, stop and tell the person which rule and
why.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
