# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| The catalog and the loader's tests | `npm run check` |
| The plugin: its catalog current, it and the marketplace valid | `npm run check:plugin` |
| The site | `npm run build` |
| Regenerate the plugin's catalog | `npm run build:plugin` |

## Before you change anything

Run `npm run check` before changing anything, and note what already fails. When you finish, run it again and compare:
a check that passed and now fails is yours to fix; one that already failed is not, so name it in your report and leave
it, unless the task is to fix it.

## Before you finish

`npm run check && npm run check:plugin` runs when you end the turn, and a failure keeps you working. When it says the
plugin's catalog is out of date, run `npm run build:plugin` and commit the result; never edit
`plugins/claude/skills/sensorloop/catalog/` by hand. The same failure three times hands it to the person.

Before each `git commit`, `npm run build` builds the site, and a failure refuses the commit: fix the page or the card
it names.

## Ask a person first

`git push`, and the site's deploy (`npx wrangler@4 deploy`). A refused action is not tried another way (a rewritten
command, a script, `gh api`): say what you did not do and go on with the rest, or ask what to do instead.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
