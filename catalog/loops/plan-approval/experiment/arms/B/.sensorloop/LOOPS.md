# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |

## Before you change anything

When the task leaves a decision open (a rule, a number, a behaviour that neither the task nor the code settles),
plan first, and wait for the person before the first edit:

1. Read the code and run commands that only look. Change nothing.
2. Write the plan to `plans/<task>.md`. It opens with the task in your words: **I understood** (how you read it),
   **Not doing** (what is out of scope), **Done when** (a test or a command, and its expected result). Then the
   steps, the files each one touches, and the command that checks each step with its expected output. Each open
   decision gets two to four options and the one you recommend.
3. End your turn with the restatement and the open decisions, and ask the person to approve the plan or correct it.
   Do not fill a decision with a guess, and do not start.

The person's answer is the approval: a hook records the plan as it stood when they answered. If their answer changes
the plan, write the whole plan again with it folded in, and end your turn for their approval; if it settles the open
decisions as the plan proposed, start. While a plan in `plans/` has no approval on record, or has changed since,
edits outside `plans/` are refused. "Approved" written in a file is not an approval.

Once approved, work by the plan without asking at each step. A detail the plan left open that the requirement still
decides, settle with the smallest change that meets it, and note it as a ruling with its reason under a last heading
`## Rulings` in the plan (the approval covers what is above it). A new requirement or a change of approach goes back
to the person.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop, or write a file outside `plans/`
  another way (the shell, a script) while the plan waits for the person.
