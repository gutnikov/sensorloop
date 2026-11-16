# Arm B: the project with the loop

Built by hand from the card (`catalog/loops/agent-code-review/card.md`): the loop is not in the plugin's `wiring/`, so
this is what the sensorloop skill would set up following the card's "The loop" and "Set up", in the shape it gives a
project (`procedures/loops-file.md`), with the reviewer written as `procedures/agent-prompt.md` says, and in
`check.sh`'s conventions. The driver does not copy this file into the project.

## What it adds

| File | What it is |
|---|---|
| `.claude/agents/code-reviewer.md` | The reviewer: a subagent with a fresh context and tools that only read (Read, Grep, Glob, Bash for `git diff` and the like). One lens, correctness, as a checklist (the task, inputs from outside the code, failures, state, callers); high findings only, each with `file:line`, the evidence and the smallest fix, checked a second time against the code before it is reported (an unconfirmed one goes to LOG as advice); a fixed answer shape (`VERDICT`, `HIGH`, `LOG`, and what to write when there is nothing); a re-review that checks only the open findings on the fix diff. |
| `.sensorloop/hooks/review.sh` | The gate. SessionStart records the commit the session starts from (the base). SubagentStart and SubagentStop on `code-reviewer` record the commit a review read, and keep its report in `.sensorloop/state/reviews/` (a report without a `VERDICT` line is not a review). Stop refuses to end the turn (exit 2, `sensorloop: review failed (...)`) while the work is uncommitted, a review is still running, or the latest commit has no review on record; four reviews at most (the first and three rounds of fixes), then the agent writes its rulings; the same refusal three times hands over to the person. |
| `.claude/settings.json` | The four hooks, and `env: CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`: in Claude Code 2.1.325 the Agent tool runs a subagent in the background by default and ignores `run_in_background: false`, so the agent would end its turn before the findings came back. With background tasks off, the call waits for the reviewer's report. It also turns off background shell commands, which this task does not need. |
| `.sensorloop/LOOPS.md`, `.sensorloop/loops.yaml` | The loop as the skill writes it down: after the tests pass, commit; ask the reviewer with the task word for word and the base, nothing of the agent's reasoning; fix the high findings with tests, commit, re-review only the open ones; three rounds of fixes at most, then a ruling per open finding. The reviewer is recorded as not yet calibrated: its findings are advice the agent acts on. |
| `CLAUDE.md.append`, `.gitignore.append` | The import line `@.sensorloop/LOOPS.md`, and `.sensorloop/state/`. |

The image is unchanged: the hook needs only git and jq, which the base image has; the reviewer runs on the session's
model (`CLAUDE_CODE_SUBAGENT_MODEL`).

Left out of the card: reviewers for other lenses (security, tests, conventions); the fresh implementer on a stronger
model in rounds four and five (one model in the sandbox; the hook stops at three rounds of fixes); the CI job that
reruns the reviewers on the pull request (no remote); the person reading diffs over 500 lines; a hook refusing edits to
the reviewer's definition.

## Proved without a session

2026-11-15, in a container of the experiment's image (`--arm B --runs 0`), the overlay applied as the driver does
(copied into `/work`, `.append` files appended, hooks made executable, one commit as `node`), then each hook run as
Claude Code runs it, its JSON input on stdin, as `node` in `/work`.

**The mistake** (`hidden/mistake.patch`): pilot run 2 of arm A with its path check removed, so a customer id such as
`../../x` from the invoices file writes outside `--out` (`join(dir, \`${customerId}.csv\`)`). Its tests and type check
pass.

```
## SessionStart                                      exit=0, base 6338771
## Stop, the mistake not committed
sensorloop: review failed (the work is not committed). The reviewer reads only what is committed. Run the tests,
commit the work (or remove what does not belong in it), then ask the code-reviewer agent to review it, as
.sensorloop/LOOPS.md says. Not committed: M README.md, M src/cli.ts, M src/export/csv.ts, ?? tests/csv.test.ts
exit=2
## Stop, the mistake committed (dec07cf), no review
sensorloop: review failed (the latest commit, dec07cf, has no review on record). Ask the code-reviewer agent (the Agent
tool, subagent_type "code-reviewer", ...) to review `git diff 6338771...HEAD`. Give it the task word for word and the
base commit, nothing of your own reasoning. Then fix each high finding it confirms, as .sensorloop/LOOPS.md says.
exit=2
```

**The reviewer on the mistake**, one run (`claude -p --agent code-reviewer`, deepseek-flash, hooks off; the prompt the
agent is told to give: the base and the task word for word). 10 turns, 44 s; 10,270 input tokens, 31,104 read from
cache, 7,468 output (6,402 of them thinking):

```
VERDICT: changes requested
HIGH
1. src/export/csv.ts:33 (with src/export/csv.ts:46,51): a customer id taken from the invoices file is used directly as
a path segment, so an id containing `..` writes outside the `--out` directory. Evidence: `src/parse.ts:38` accepts any
non-empty string as `customer.id`, including `../../etc/x`; running `invoicer csv /srv/billing/export/invoices.json
--out /srv/reports/customers` reaches `customerFile` at csv.ts:33, where `join('/srv/reports/customers',
'../../etc/x.csv')` normalises to `/srv/etc/x.csv`, and `writeFileSync` at csv.ts:51 writes/overwrites that file. [...]
Fix: after building the target path, resolve it and reject (as an `InvoiceFileError`) any target that is not strictly
inside the resolved `--out` directory, or accept only single-segment filename-safe ids [...]
LOG
- src/export/csv.ts:38: medium: files for customers no longer present in the export [...] are never removed [...]
- (three low findings)
```

**The record and the pass**, its report fed to the hooks as Claude Code would (SubagentStart, then SubagentStop with
`agent_type: "code-reviewer"` and the report as `last_assistant_message`):

```
## Stop while the review runs
sensorloop: review failed (the code-reviewer is still reviewing dec07cf). Wait for its report, then act on it [...]
exit=2
## SubagentStop of another agent type             exit=0, nothing recorded
## SubagentStop of the reviewer                   exit=0, reviews.log: dec07cf... .sensorloop/state/reviews/1-dec07cf.md
## Stop, the commit reviewed                      exit=0
## Stop after a fix commit (1fa4237), not re-reviewed
sensorloop: review failed (the latest commit, 1fa4237, has no review on record (the last review read dec07cf)). Ask
the code-reviewer agent to re-review only the open high findings, word for word, on `git diff dec07cf..HEAD`. Round 1 of 3.
exit=2
## the same refusal twice more                    exit=2, then:
{"systemMessage":"sensorloop: review: the latest commit, 1fa4237, has no review on record (the last review read
dec07cf), after 3 rounds; over to you."}                                        exit=0
```

**In Claude Code itself**, against a stand-in for the model's API (a local server that scripts the agent and the
reviewer; no model calls), started as the driver starts it (`claude --dangerously-skip-permissions`, in tmux): the
agent commits and ends its turn; the Stop hook refuses ("Stop hook error: ... sensorloop: review failed (the latest
commit, 148bec2, has no review on record)"); the agent calls the `code-reviewer` subagent, which gets the reviewer's
prompt as its system prompt; the call returns its report ("Done (0 tool uses)"); SubagentStop records 148bec2; the next
Stop passes. Without `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`, the same run showed the subagent launched in the
background ("Async agent launched successfully") although the call asked for `run_in_background: false`.

The reviewer's prompt gained one paragraph after the Actual experiment's proof (`../../experiments/actual-9477/arms/B/`),
where the reviewer saw the defect and rated it low: "Rate a finding by what happens, not by how many meet it". The run
above was made before that paragraph; it rated the traversal high without it.
