# The project's loop files

Everything sensorloop keeps lives under `.sensorloop/` in the project, plus the hooks and permissions in
`.claude/settings.json` and any CI job a loop needs. Add `.sensorloop/state/` to `.gitignore`: the hooks keep their
counters there.

## `.sensorloop/loops.yaml`: the registry

The one home of the project's loops. `LOOPS.md` is written from it; nothing else holds the same facts.

```yaml
# Kept by the sensorloop skill. Edit it by hand or ask the agent; then ask the agent to rewrite LOOPS.md.
version: 1
project:
  stack: [python]                 # languages and frameworks found
  commands:                       # the project's own commands, as CI runs them; null when there is none
    test: pytest -q
    typecheck: mypy src
    build: null
    lint: ruff check .
    format: ruff format .
  has: [ci]                       # what exists beyond the repo: ci, deploy, preview, browser, logs, metrics, traces, errors
  limits:                         # what the person said, in their words
    - No paid model calls in CI.
    - Nobody watches the agent at night.
loops:
  - id: type-check-and-build      # a loop id from catalog/loops/
    status: active                # active | proposed | off
    wiring: >-
      PostToolUse on Edit|Write|MultiEdit runs `mypy src` (.sensorloop/hooks/check.sh typecheck).
    proved: 2026-11-13            # when you last saw it fire, for active loops
  - id: preview-environments
    status: proposed
    needs: a deploy target per pull request
    why: UI changes are reviewed only after merge today.
```

Rules: one entry per loop id; `wiring` says exactly what runs where; `proved` is the date you made it fail on
purpose and saw the signal; a loop that cannot run here is `proposed` with its `needs`, never `active`.

## `.sensorloop/LOOPS.md`: what an agent here must know

Written from the registry after every change. It is read by every agent session through `CLAUDE.md`, so it is short,
imperative and specific to this project. Shape:

```markdown
# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `pytest -q` |
| Type check | `mypy src` |
| Lint | `ruff check .` |

## Before you change anything
<run-tests-first, in one or two sentences: run `pytest -q` and note what already fails.>

## While you work
<one short paragraph per active loop that acts during the work: what fires, what its signal means, what to do.>

## Before you finish
<the checks that run when the turn ends, and what to do when they block; three identical failures go to the person.>

## Ask a person first
<the gated actions, from risky-action-gates.>

## Never
- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
```

Leave out sections with nothing in them. Proposed loops do not go in `LOOPS.md`: they are not in force.

## `CLAUDE.md`

Add one line, `@.sensorloop/LOOPS.md`, under a heading such as `## Loops`. If `CLAUDE.md` does not exist, create it
with that heading and line. Do not copy the content of `LOOPS.md` into it, and do not rewrite anything else in it.

## Hooks in `.claude/settings.json`

Merge into the existing file; never drop what is there. Commands point into the project:
`"$CLAUDE_PROJECT_DIR"/.sensorloop/hooks/check.sh <label> '<command>'`. Give slow checks a `timeout` (seconds).
After writing, show the person the diff of the file.

## When writing to `.claude/` is refused

Claude Code may refuse writes into `.claude/` (it guards that folder, and refuses outright in some modes). Never get
around a refusal with the shell or a script. Write the exact content beside the registry instead:
`.sensorloop/settings.to-apply.json` for the settings, `.sensorloop/agents/<name>.md` for a subagent. Tell the person
the one step that puts it in place (copy or merge it into `.claude/`). Prove the hooks by running their scripts
directly, and record the loops they serve as `proposed` with `needs: .sensorloop/settings.to-apply.json applied`,
until the settings are in place.
