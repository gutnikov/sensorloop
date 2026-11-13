---
title: Agent activity
type: computational
summary: Watches the agent's own tool calls and sessions, and reports the patterns that mean it is in trouble.
signal: "A named pattern with its evidence: the same call repeated, an edit with no failing test on record, a tool's failure rate, a run that stalled."
---

Agent activity watches the coding agent's own tool calls and sessions, and reports the patterns that mean it is in
trouble. Loops read it to notice an agent that is stuck, or that changes code without evidence, before its output
reaches a review.

## What it sees

It has two sources. Hooks see every tool call as it happens, early enough for a loop to refuse the call. Session
transcripts are read afterwards and show trends across many sessions. It sees what the agent did, not what the code
does: an agent that works in good order can still produce wrong code.

## Reading the signal

- **No pattern**: nothing in the calls or sessions read matches a known sign of trouble.
- **A named pattern**: the pattern and its evidence, such as the same call repeated, an edit made with no failing test
  on record, a tool that keeps failing, or a run that stalled.

A gap in the record, such as a hook that did not run or a transcript cut short, is not a quiet session. Read missing
data as missing, not as a pass.
