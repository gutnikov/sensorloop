---
title: Agent activity
type: computational
summary: Watches the agent's own tool calls and sessions, and reports the patterns that mean the agent is in trouble.
signal: "A named pattern with its evidence, such as the same call repeated, an edit with no failing test on record, a tool that keeps failing, or a run that stalled."
---

Loops read agent activity to notice a coding agent that is stuck, or that changes code without evidence, before its
work reaches a review.

## What it sees

It has two sources. Hooks see every tool call as it happens, early enough for a loop to refuse the call. Session
transcripts are read afterwards and show trends across many sessions. It sees what the agent did, not what the code
does: an agent that works in good order can still produce wrong code.

## Reading the signal

- **No pattern**: no tool call or session matches a pattern the sensor watches for.
- **A named pattern**: the pattern and its evidence, such as the same call repeated, an edit made with no failing test
  on record, a tool that keeps failing, or a run that stalled.

A gap in the record, such as a hook that did not run or a transcript cut short, is not "No pattern". Read missing data
as missing.
