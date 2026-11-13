---
title: Session transcripts
summary: "The record the coding agent keeps of each session: the prompts, the tool calls and their results."
sensors: [agent-activity, loop-outcomes]
layer: agent
---

The coding agent keeps a record of each session: the prompts, the tool calls and their results. Read afterwards, and
across many sessions, it shows what the agent actually did.

## Finding it

The agent decides where it writes them. Claude Code keeps one JSON Lines file per session under `~/.claude/projects/`,
in a directory named after the project's path. An agent that exports OpenTelemetry events sends them to the collector
its settings name.

## Using it

- **In batches, on a schedule**: patterns show across many sessions, not in one.
- **Parse the records**: each line is a JSON object, and `jq` picks out the tool calls, their results and their
  errors.
- **Scrub before sharing**: transcripts hold file contents, commands and sometimes secrets, which are removed before
  anything leaves the machine.
- **Keep them long enough**: Claude Code deletes old transcripts after a set number of days (`cleanupPeriodDays`), so
  copy them when they are needed later.

Examples: Claude Code's session files, OpenTelemetry events from the agent.
