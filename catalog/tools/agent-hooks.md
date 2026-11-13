---
title: The agent's hooks
summary: Commands the coding agent runs before and after each tool call and when it is about to stop, which can record the call or refuse it.
sensors: [agent-activity]
layer: agent
---

Hooks are commands the coding agent runs before and after each tool call, and when it is about to stop. A hook sees
each call as it happens, so it can record the call or refuse it.

## Finding it

They are set in the coding agent's settings: in Claude Code, the `hooks` section of `.claude/settings.json` in the
project, or of the user's own settings. A person approves them, since a hook runs with that person's rights; `/hooks`
in Claude Code lists the active ones.

## Using it

- **Record**: a `PostToolUse` hook appends each call and its result to a log, for patterns read later.
- **Refuse**: a `PreToolUse` hook that exits with code 2 blocks the call, and what it writes to standard error goes
  back to the agent as the reason.
- **Before the agent stops**: a `Stop` hook can run the checks and, when they fail, exit with code 2 to keep the agent
  working, with the failure as its reason.
- **Quick and narrow**: a hook runs on every matching call, so it is fast and matches only the tools it is about.

Examples: Claude Code hooks (`PreToolUse`, `PostToolUse`, `Stop`), and the equivalents in other coding agents.
