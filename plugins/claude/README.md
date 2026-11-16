# sensorloop for Claude Code

The `sensorloop` skill keeps a project's validation loops: the checks that catch a coding agent's mistakes, fitted to
what the project has and what its people need. It sets the loops up, keeps them in step with the project, diagnoses
problems in the flow of changes, and writes the prompts of service agents (reviewers, judges, triagers).

Before it sets loops up or changes them, the `interview` skill finds out what the person needs: rounds of questions
over a tree of needs, each with a recommended answer, with the facts looked up in the project instead of asked.

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
- `skills/interview/`: the interview about the person's needs that setup and change begin with, and its tree.
- `agents/flow-auditor.md`: a read-only subagent that gathers the evidence when the flow is diagnosed.
- `evals/`: the eval suite, run with `claude plugin eval plugins/claude`.
