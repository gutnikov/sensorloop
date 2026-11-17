# sensorloop for Claude Code

The `sensorloop` skill keeps a project's validation loops: the checks that catch a coding agent's mistakes, fitted to
what the project has and what its people need. It sets the loops up, keeps them in step with the project, diagnoses
problems in the flow of changes, and writes the prompts of service agents (reviewers, judges, triagers).

Before it sets loops up or changes them, the `interview` skill shows the person the tools the project already has,
then finds out what they need: one or two questions a turn, for at most five turns, the ones that change the setup
most first, each with a recommended answer and only the options the earlier answers leave open. Facts are looked up
in the project instead of asked. After the setup, the skill proves each loop it wired and reports how each was
checked.

## Install

```
/plugin marketplace add gutnikov/sensorloop
/plugin install sensorloop@sensorloop
```

How to use it, and what it leaves in a project: https://sensorloop.dev/get-started/. The model behind it, and every
sensor, tool and loop it knows: https://sensorloop.dev.

## Contents

- `skills/sensorloop/`: the skill, its procedures, the wiring pages of the loops most projects get, and the catalog
  (generated from the repository's `catalog/`), whose cards it wires every other loop from.
- `skills/interview/`: the interview about the person's needs that setup and change begin with, and its tree.
- `agents/flow-auditor.md`: a read-only subagent that gathers the evidence when the flow is diagnosed.
- `evals/`: the eval suite, run with `claude plugin eval plugins/claude`.
