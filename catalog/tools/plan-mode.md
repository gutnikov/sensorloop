---
title: Plan mode
summary: A mode in which the coding agent may only read and plan, until a person approves the plan.
sensors: [human-answer]
layer: agent
---

Plan mode keeps the coding agent to reading and planning: it may explore the code but change nothing until a person
approves the plan. It is a mode of the agent itself.

## Finding it

- **Claude Code**: Shift+Tab switches into it, `claude --permission-mode plan` starts in it, and `defaultMode` in
  the settings' `permissions` makes it the default.
- **Other coding agents**: a plan mode of their own, or a read-only approval setting.

## Using it

- **For work whose direction a person should settle first**: a change across many files, a migration, anything hard
  to undo.
- **The plan names** the files to change, the steps, and how each step will be checked.
- **Keep the approved plan**, in the repository or the session's record, so later work can be checked against it.
- **A rejected plan comes back with the reason**, and the agent plans again.

Examples: plan mode in Claude Code and in Codex.
