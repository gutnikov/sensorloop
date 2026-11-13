---
title: Interrupt and rewind
summary: The coding agent's controls to stop it in the middle of a step, and to roll its changes back to an earlier point.
sensors: [live-supervision]
layer: agent
---

The coding agent's controls stop it in the middle of a step and roll its changes back. They are how a person watching
the work turns a drift into a correction.

## Finding it

- **Claude Code**: Esc stops the current step; Esc twice, or `/rewind`, goes back to an earlier checkpoint.
- **Other coding agents**: checkpoints or snapshots of the files they edit.
- **What checkpoints miss**: changes made by shell commands (a migration, a file a script wrote) are not in them; git
  is the fallback.

## Using it

- **Interrupt early**, when the direction is wrong, not after the step finishes.
- **Follow with the correction** as the next instruction: what was wrong, and what to do instead.
- **Rewind the code, the conversation or both** to before the step that drifted.
- **Record the correction**: one made twice should become a rule.

Examples: Esc and `/rewind` in Claude Code, checkpoints and snapshots in other coding agents.
