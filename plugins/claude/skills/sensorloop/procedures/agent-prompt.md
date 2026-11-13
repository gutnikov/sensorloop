# Agent prompt: a service agent that reads the work

A service agent is a sensor: a reviewer, a judge, a triager, a verifier. Its prompt decides whether its signal can be
trusted. Read the cards of the sensor it is ([../catalog/sensors/llm-reviewer.md](../catalog/sensors/llm-reviewer.md),
[../catalog/sensors/llm-judge.md](../catalog/sensors/llm-judge.md)) and of the loop it serves, then write it as a
subagent file, `.claude/agents/<name>.md`.

## What every service agent's file has

- **A description** that says when to call it, so the working agent hands it the right work.
- **Read-only tools**: `Read`, `Grep`, `Glob`, and `Bash` only for commands that read (and say so). A sensor only
  observes; it never fixes what it judges.
- **A fresh context**: it gets the artifact (the diff, the document, the screenshot, the item) and the criteria, never
  the working session's reasoning, so it has no stake in the work.
- **Criteria written down**: a checklist, a policy or a rubric, specific to this project, each item checkable.
- **A structured answer** the loop can parse: for a reviewer, findings with `file:line`, severity and the evidence;
  for a judge, pass or fail (or a score against a threshold) with the reason; for a triager, the kind, the reason and
  any duplicate. Say exactly what to return when there is nothing to report.
- **Limits**: what it must not do (approve on its own, write, close, merge), and when to say it cannot judge.

## Before it may block

Write down how it will be calibrated: a set of cases with known answers (past pull requests, graded samples) that it
runs against several times, and the agreement it must reach before its verdict blocks anything. Until then it only
advises. Record it in the registry under the loop it serves, with `status: proposed` until it is calibrated.

## Then

Show the person the file. If writing to `.claude/agents/` is refused, write it to `.sensorloop/agents/<name>.md`
instead and tell the person to copy it there ([loops-file.md](loops-file.md)). If the agent serves a loop, add or
update that loop in `loops.yaml` and in `LOOPS.md` (what the working agent must do with its verdict).
