# Get started

sensorloop is a plugin for Claude Code. Its skill keeps your project's validation loops: it sets up the checks that catch an agent's mistakes, fitted to what your project has and what your people need, keeps them in step as the project changes, and finds the loop that should have caught a problem.

## Install

In a Claude Code session:

```
/plugin marketplace add gutnikov/sensorloop
/plugin install sensorloop@sensorloop
```

Or from a terminal:

```bash
claude plugin marketplace add gutnikov/sensorloop
claude plugin install sensorloop@sensorloop
```

<!-- cast: install | Installing the plugin -->

The plugin loads in your next session. To give it to the whole team, add `--scope project` to both commands: the marketplace and the plugin are then declared in the project's `.claude/settings.json`, which you commit, and each teammate's Claude Code offers to install them.

Update with `claude plugin update sensorloop@sensorloop`. The loops need `bash`, and `python3` for the stall detector.

## Use it

Ask in plain words. The skill loads when the work calls for it; you do not name it.

**Set a project up for coding agents.** "Set this repo up so the agent's work gets checked properly." The agent:

1. Reads how the project builds, tests and lints, as its CI and task files run them.
2. Asks a few questions about your limits: whether the agent works watched or unattended, which actions need a person, what it may spend.
3. Proposes a few loops that fit, with the changes each makes.
4. After your yes, wires them, and makes each one fail once on purpose to prove it fires.
5. Writes them down.

<!-- cast: setup | Setting up a small project -->

**When the project changes.** "We moved to Vitest and added a type check; make sure the agent's checks still work." It compares the loops with the project, and fixes the wiring that drifted.

**When something keeps going wrong.** "Regressions keep reaching main although the agent says the tests pass. Why, and what should change?" It gathers the evidence (CI runs, git history, agent sessions), finds the earliest point where the problem could have been caught, and proposes the loop that would catch it there.

**Write a service agent.** "Write the prompt for a subagent that reviews our diffs for security problems." It writes a reviewer, judge or triager as a sensor: read-only, a fresh context, written criteria, a structured verdict, and advice only until it is calibrated.

**Keep CLAUDE.md current.** "Update CLAUDE.md so agents know how the checks here work." It rewrites the instructions on the loops from the project's registry.

At the end of each of these, it names at most three loops, sensors or tools that would make the flow better, and what each costs. It proposes them; it installs nothing without a yes.

## What it leaves in your project

| File | What |
|---|---|
| `.sensorloop/loops.yaml` | The registry: the project's commands, what it has, your limits, and every loop with its status and wiring |
| `.sensorloop/LOOPS.md` | What an agent working here must know about the loops, written from the registry |
| `CLAUDE.md` | One line, `@.sensorloop/LOOPS.md`, so every session reads it |
| `.sensorloop/hooks/` | The scripts the hooks run |
| `.claude/settings.json` | The hooks, and the actions that ask a person first |

Commit them all, except `.sensorloop/state/`, which it adds to `.gitignore`. The loops live in the project, not in the plugin: teammates without the plugin, and CI, run them the same way. The plugin is what keeps them current.

## The loops it wires

It wires six loops itself: [Run the tests first](/loops/run-tests-first/), [Red, then green](/loops/red-green-tdd/), [Type check and build](/loops/type-check-and-build/), [Lint with fix instructions](/loops/lint-with-fix-instructions/), [Ask before the irreversible](/loops/risky-action-gates/) and [Stall detector](/loops/stall-detector/).

Every other loop in the [catalog](/loops/) it proposes when your project calls for it, with what your project must provide, and records it in the registry as proposed.
