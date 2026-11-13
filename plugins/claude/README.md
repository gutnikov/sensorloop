# sensorloop for Claude Code

The `sensorloop` skill keeps a project's validation loops: the checks that catch a coding agent's mistakes, fitted to
what the project has and what its people need. It sets the loops up, keeps them in step with the project, diagnoses
problems in the flow of changes, and writes the prompts of service agents (reviewers, judges, triagers). The model
behind it, and every sensor, tool and loop it knows, are at https://sensorloop.dev.

## Install

```
/plugin marketplace add gutnikov/sensorloop
/plugin install sensorloop@sensorloop
```

## Use

Ask in plain words; the skill loads when the work calls for it:

- "Set this repo up so the agent's work gets checked properly."
- "We moved to Vitest and added a type check; make sure the agent's checks still work."
- "Regressions keep reaching main although the agent says the tests pass. Why, and what should change?"
- "Write the prompt for a subagent that reviews diffs for security problems."

## What it writes in your project

- `.sensorloop/loops.yaml`: the registry of the project's facts, limits and loops.
- `.sensorloop/LOOPS.md`: the loops an agent must know about, imported into `CLAUDE.md` by one line.
- `.sensorloop/hooks/`: the scripts the hooks run (bash, and Python 3 for the stall detector).
- Hooks and `ask` permissions in `.claude/settings.json`.

Everything lives in the project, so the loops work for teammates without the plugin, and in CI. The skill asks before
it writes, proves each loop fires, and never weakens a check to make it pass.

## Contents

- `skills/sensorloop/`: the skill, its procedures, the wiring of the loops it installs, and the catalog (generated
  from the repository's `catalog/`).
- `agents/flow-auditor.md`: a read-only subagent that gathers the evidence when the flow is diagnosed.
- `evals/`: the eval suite, run with `claude plugin eval plugins/claude`.
