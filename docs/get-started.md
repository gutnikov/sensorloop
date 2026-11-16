# Get started

sensorloop is a plugin for Claude Code. It keeps your project's validation loops: it interviews you about what you need, sets up the checks that catch an agent's mistakes, fitted to what your project has and what you told it, keeps them in step as the project changes, and finds the loop that should have caught a problem.

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

The plugin loads in your next session. To give it to the whole team, add `--scope project` to both commands: the marketplace and the plugin are then declared in the project's `.claude/settings.json`, which you commit, and each teammate's Claude Code offers to install them.

Update with `claude plugin update sensorloop@sensorloop`. The loops need `bash`, and `python3` for the stall detector.

## Use it

Ask in plain words. Its two skills, `sensorloop` for the loops and `interview` for what you need from them, load when the work calls for them; you do not name them.

**Set a project up for coding agents.** "Set this repo up so the agent's work gets checked properly." The agent:

1. Reads how the project builds, tests and lints, as its CI and task files run them.
2. Interviews you about what you need, in a few rounds of numbered questions, each with the answer it recommends. It starts with what you are building (unless the code shows it), how much the agent should do on its own, and when it may call you; the next rounds follow from your answers: which actions need a person, what would hurt if a change broke it, where you want to approve the work, what the loops may spend. It asks only what the repository cannot tell it. It sets nothing up until you confirm its summary of what you said.
3. Proposes a few loops that fit those needs, with the changes each makes.
4. After your yes, wires them, and makes each one fail once on purpose to prove it fires.
5. Writes them down, with what you told it in the interview.

A first round, for an orders API whose code shows how it deploys:

```
❓ Q1 · What you are building: The code shows the orders API of a shop, deployed to Fly.io
with `npm run deploy`, which runs the migrations against the production database. Is the
shop's front end its only client?

➡️ Yes: the front end is the only client.

---

❓ Q2 · How much the agent does on its own: Should it work in a session you watch, take a
whole task and come back with a pull request, or run several tasks overnight with nobody
watching?

➡️ A whole task at a time, ending in a pull request you review.

---

❓ Q3 · When it may call you: Whenever it is unsure; only before something that cannot be
undone, such as the deploy, or when it is stuck; or never while it works, only through
the pull request it leaves?

➡️ Only before something that cannot be undone, and when it is stuck, in the session.
```

Answer by number ("1 yes, 2 yes, 3 never while it works"). The next round follows from those answers: what would hurt most, which actions wait for you, who reviews, what the loops may spend. To be interviewed before you decide to set anything up, type `/sensorloop:interview`.

**When the project changes.** "We moved to Vitest and added a type check; make sure the agent's checks still work." It compares the loops with the project, and fixes the wiring that drifted.

**When what you need changes.** "From next week agents will work overnight with nobody watching." It interviews you again, starting from what you told it last time and asking only about what the change touches, then changes the loops to match.

**When something keeps going wrong.** "Regressions keep reaching main although the agent says the tests pass. Why, and what should change?" It gathers the evidence (CI runs, git history, agent sessions), finds the earliest point where the problem could have been caught, and proposes the loop that would catch it there.

**When you change how work gets made.** "For features with screens, I want to see a prototype of each one before the agent writes the code." A step where you approve the work is a loop too, with you as its sensor. It finds where the step belongs in the flow, and the check that keeps the agent from skipping it.

**Write a service agent.** "Write the prompt for a subagent that reviews our diffs for security problems." It writes a reviewer, judge or triager as a sensor: read-only, a fresh context, written criteria, a structured verdict, and advice only until it is calibrated.

**Keep CLAUDE.md current.** "Update CLAUDE.md so agents know how the checks here work." It rewrites the instructions on the loops from the project's registry.

At the end of each of these, it names at most three loops, sensors or tools that would make the flow better, and what each costs. It proposes them; it installs nothing without a yes.

## What it leaves in your project

| File | What |
|---|---|
| `.sensorloop/loops.yaml` | The registry: the project's commands, what it has, what you want from the loops and your limits, and every loop with its status and wiring |
| `.sensorloop/LOOPS.md` | What an agent working here must know about the loops, written from the registry |
| `CLAUDE.md` | One line, `@.sensorloop/LOOPS.md`, so every session reads it |
| `.sensorloop/hooks/` | The scripts the hooks run |
| `.claude/settings.json` | The hooks, and the actions that ask a person first |

Commit them all, except `.sensorloop/state/`, which it adds to `.gitignore`. The loops live in the project, not in the plugin: teammates without the plugin, and CI, run them the same way. The plugin is what keeps them current.

## The loops it wires

It wires six loops itself: [Run the tests first](/loops/run-tests-first/), [Red, then green](/loops/red-green-tdd/), [Type check and build](/loops/type-check-and-build/), [Lint with fix instructions](/loops/lint-with-fix-instructions/), [Ask before the irreversible](/loops/risky-action-gates/) and [Stall detector](/loops/stall-detector/).

Every other loop in the [catalog](/loops/) it proposes when your project calls for it, with what your project must provide, and records it in the registry as proposed. Which ones it proposes follows from what you told it in the interview.
