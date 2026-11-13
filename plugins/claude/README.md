# sensorloop for Claude Code

The `sensorloop` skill keeps a project's validation loops: the checks that catch a coding agent's mistakes, fitted to
what the project has and what its people need. It sets the loops up, keeps them in step with the project, diagnoses
problems in the flow of changes, and writes the prompts of service agents (reviewers, judges, triagers).

## Install

```
/plugin marketplace add gutnikov/sensorloop
/plugin install sensorloop@sensorloop
```

How to use it, and what it leaves in a project: https://sensorloop.dev/get-started/. The model behind it, and every
sensor, tool and loop it knows: https://sensorloop.dev.

## Contents

- `skills/sensorloop/`: the skill, its procedures, the wiring of the loops it installs, and the catalog (generated
  from the repository's `catalog/`).
- `agents/flow-auditor.md`: a read-only subagent that gathers the evidence when the flow is diagnosed.
- `evals/`: the eval suite, run with `claude plugin eval plugins/claude`.
