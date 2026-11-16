# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |

## Ask a person first

`git push` and `npm publish` ask before they run. The person may not be watching: a reviewer answers in their place,
by the project's policy (`.sensorloop/reviewer-policy.md`), which says that a release goes out only after the person
has read its changelog. A denied action fails with the reason and the rule. Do not reach the same effect another way (a
rewritten command, a script, `git -C`, another remote): finish the work the denial does not touch, then tell the person
what you did not do and why. Only a materially safer method may be tried, and it is reviewed again. Three denials
since the person last spoke stop the turn.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
