# Arm B: the project with the loop

Built by hand from the card (`catalog/loops/plan-approval/card.md`): the loop is not in the plugin's `wiring/`, so this
is what the sensorloop skill would set up following the card's "The loop" and "Set up", in the shape it gives a project
(`procedures/loops-file.md`) and in `check.sh`'s conventions. The driver does not copy this file into the project.

## What it adds

| File | What it is |
|---|---|
| `.sensorloop/LOOPS.md` | The loop, under "Before you change anything": when the task leaves a decision open, read only, write the plan to `plans/<task>.md` (I understood, Not doing, Done when; the steps with the files and the command that checks each; each open decision with two to four options and a recommended one), end the turn asking the person to approve or correct it, and do not guess or start. The person's answer is the approval; an answer that changes the plan means the whole plan again, and another answer. Then work by the plan, rulings under a closing `## Rulings`; a new requirement goes back to the person. |
| `.sensorloop/hooks/plan-gate.sh` | The gate. SessionStart records the commit the session starts from. UserPromptSubmit records each plan of this work (a file in `plans/` that is new, changed, or committed since then) as it stands when the person answers: its hash, in `.sensorloop/state/plan-approvals.log`, written by the hook, never by the agent. PreToolUse on Edit, Write, MultiEdit and NotebookEdit refuses an edit outside `plans/` (exit 2, `sensorloop: plan failed (...)`) while a plan is `empty`, has `no approval record` or has `changed since approval`, and says what to do; "approved" written in a file counts for nothing. The approval covers the plan above a closing `## Rulings` heading, so rulings noted during the work keep it. |
| `.claude/settings.json` | The three hooks. |
| `.sensorloop/loops.yaml` | The registry, with why the gate is a hook rather than plan mode. |
| `CLAUDE.md.append`, `.gitignore.append` | The import line `@.sensorloop/LOOPS.md`, and `.sensorloop/state/`. |

The image is unchanged (the hook needs git, jq and sha256sum, which the base image has). The person is unchanged: their
`first_reply` (finance's rule) comes after the agent's first turn in both arms. When the agent then rewrites its plan
and waits again, nothing in the code has changed, so the driver's person says "Please go ahead and implement it.", the
approval of the rewritten plan; that nudge counts against `max_reports` as it does in arm A.

**Why not plan mode.** Claude Code's plan mode is the card's tool, but it does not fit this harness. The driver starts
every arm with `--dangerously-skip-permissions`, which wins over a `defaultMode: plan` setting: started that way with
`{"permissions":{"defaultMode":"plan"}}`, the session showed `⏵⏵ bypass permissions on`; only `--permission-mode plan`
showed `⏸ plan mode on`, and the driver waits for "bypass permissions on" to start. The card says plan mode's blocks
do not hold in a session with bypass permissions, and the question tool is off in every arm. So the gate is a hook on
the edit tools, and the approval record a hook on the person's message.

Left out of the card: fetching the ticket (the task is pasted whole); the `no checks` status; the reviewer of the diff
against the plan at the end; a fresh implementing session. The gate sees the edit tools only: a file written through
the shell is not refused (`LOOPS.md` forbids it).

## Proved without a session

2026-11-15, in a container of the experiment's image (`--arm B --runs 0`), the overlay applied as the driver does
(copied into `/work`, `.append` files appended, hooks made executable, one commit as `node`), then the hook run as
Claude Code runs it through the states of a session (its JSON input on stdin, as `node` in `/work`). The plan is a
sample: restatement, two steps with checks, one open decision with three options.

```
## SessionStart                                                                 exit=0
## The person pastes the task (no plan yet)                                     exit=0, nothing recorded
## An edit with no plan in plans/ (LOOPS.md decides; the gate has nothing to hold)   exit=0
## Writing the plan itself (Write plans/late-fees.md)                           exit=0
## An edit of the code (Edit src/report/aging.ts), the plan not yet answered
sensorloop: plan failed (an edit outside plans/ before the person approved the plan). Nothing changes until they do:
plans/late-fees.md: no approval record
Show the person the plan (I understood, Not doing, Done when, the steps with their checks, each open decision with the
option you recommend) and end your turn to ask them to approve or correct it. Their answer is the approval; "approved"
written in a file is not. If their answer changes the plan, write it again whole and ask again.
exit=2
## The same, with "Status: approved, execution allowed." written into the plan
plans/late-fees.md: no approval record                                           exit=2
## An empty second plan (a heading only)
plans/empty.md: empty
plans/late-fees.md: no approval record                                           exit=2
## The person answers (finance's rule)                                          exit=0
fd4b3c9610a5fbb6 plans/late-fees.md s1 2026-11-15T17:47:06Z
## An edit of the code after the answer                                         exit=0
## A ruling noted under ## Rulings                                              exit=0
## The plan rewritten after the answer (the decision changed), not yet approved again
plans/late-fees.md: changed since approval                                       exit=2
## The person answers again (the driver's nudge)                                exit=0
## An edit of the code                                                          exit=0
## The plan committed                                                           exit=0
```

No model calls.
