# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| Run the product on a file | `npm run dev -- <command> <file> [options]` |

## Before you change anything

Users' feedback reaches us as items numbered FB-<n>. An item names a problem in the user's words; it is not a spec,
and a fix the user proposes is a guess. Before you write any code for an item:

1. Draft its acceptance criteria: the problem as the user met it, a scenario that reproduces it (the invoices it
   starts from, the command, what the user sees), and what the user should see instead.
2. Run each scenario on the product as it is, and check that it shows the problem the way the user described it.
3. Send the person the criteria, with the user's words beside them, and end your turn. Write no code until they
   approve or correct them; then build what they approved, not your draft.

## While you work

Each approved criterion becomes a test named after the item (`it('FB-112: ...')`), and you see it fail on the code
before your change. Then change the code until it and the whole suite pass. Change the code, never the approved
criteria or their tests.

## Before you finish

When you end your turn, a hook reads the feedback items in the person's messages and the files you changed in this
session. If `src/` changed and no test you added or changed names the item, it keeps you working. The same failure
three times hands it to the person.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
