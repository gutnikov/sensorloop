---
name: sensorloop
description: Keeps a project's validation loops, the checks that catch an agent's mistakes (tests, type checks, linters, hooks, CI jobs, reviewer agents, gates before risky actions), fitted to the project's needs and limits. Use when setting a project up for coding agents, when its setup changes (a new stack, test command, CI or deploy), when something keeps going wrong in how changes get made (regressions slip through, CI is often red, the agent loops or breaks things, bugs reach users), when writing the prompt of a service agent such as a reviewer, judge or triager, or to keep CLAUDE.md's instructions on the loops current.
---

# sensorloop

You keep this project's loops. A **sensor** observes the work and reports a signal (pass or fail, a score, findings).
A **tool** is what a sensor is built with here (the project's own test command, its linter, its CI). A **loop**
connects a sensor to the work: when it is read, what counts as a failure, and what happens next, up to handing the
work to a person. The right loops differ per project: each costs time, money and attention, so it belongs only where
the failure it catches is likely or expensive.

## What you keep in the project

- `.sensorloop/loops.yaml`: the registry. The project's facts and limits, and every loop with its status and wiring.
- `.sensorloop/LOOPS.md`: what an agent working here must know about the loops, written from the registry, and
  imported into `CLAUDE.md` by one line, `@.sensorloop/LOOPS.md`.
- `.sensorloop/hooks/`: the scripts the hooks run, copied from `wiring/scripts/`.
- The hooks and permissions in `.claude/settings.json`, and any CI job a loop needs.

The plugin configures; the project runs. Everything a loop needs lives in the project, so it works for teammates who
do not have this plugin, and in CI. Formats: [procedures/loops-file.md](procedures/loops-file.md).

## Pick the procedure

| The ask | Read |
|---|---|
| Set the project up for coding agents; there is no `.sensorloop/loops.yaml` yet | [procedures/setup.md](procedures/setup.md) |
| The project changed (stack, commands, CI, deploy), or the registry no longer matches it | [procedures/change.md](procedures/change.md) |
| Something keeps going wrong in the flow, or the person asks how to improve it | [procedures/diagnose.md](procedures/diagnose.md) |
| Write or fix the prompt of a service agent (reviewer, judge, triager, verifier) | [procedures/agent-prompt.md](procedures/agent-prompt.md) |

Read [procedures/loops-file.md](procedures/loops-file.md) before you write anything under `.sensorloop/`.

## The catalog

[catalog/index.md](catalog/index.md) lists every sensor, tool and loop on one line, with what each is linked to.
Read it first, then only the cards you need: `catalog/loops/<id>.md`, `catalog/sensors/<id>.md`,
`catalog/tools/<id>.md`. A tool card describes a role; the program behind it is found in this project, never
assumed. Products a card names are examples.

## Rules

1. **Fit the project.** Choose loops by its facts and limits (what exists: CI, deploy, previews, a browser, logs,
   metrics; the budget; who can answer questions), not by the size of the catalog. Start with few, cheap loops.
2. **Ask before you write.** Show the person the loops you propose, why each fits, and the exact changes (files,
   hooks, permissions, CI), and get a yes. Use the question tool when you have one. If the person said they are not
   available, use sensible defaults and say what you chose.
3. **Prove each loop fires.** After wiring a loop, make it fail once on purpose and see its signal, then undo the
   break. Never leave a break behind.
4. **Never weaken a check to make it pass**: no raised thresholds, disabled rules, deleted or loosened tests, or
   suppressions without a reason. If a check is wrong, say so to the person.
5. **Keep LOOPS.md in step** with `loops.yaml`: rewrite it after every change to the registry.
6. **Wire only what you can wire well.** You wire yourself the loops in [wiring/](wiring/): run-tests-first,
   type-check-and-build, lint-with-fix-instructions, risky-action-gates, stall-detector, red-green-tdd. Any other loop
   you propose with its card, say what the project must provide, and record it with `status: proposed`.
7. **End with what could be better.** After any procedure, name at most three loops, sensors or tools that would
   improve the flow here, each with the failure it would catch and what it costs. Propose; do not install.
