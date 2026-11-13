---
title: LLM reviewer
type: inferential
summary: A separate agent with a fresh context reads a diff, a document or some code against a checklist or a policy, and lists what it finds.
signal: Findings with file:line and severity, or a verdict (pass or fail, match or mismatch) with its evidence.
---

An LLM reviewer is a separate agent, with a fresh context and read-only tools, that reads a diff, a document or some
code against a checklist or a policy, and lists what it finds. Loops read it for the problems no fixed rule can
express.

## What it sees

Meaning: whether the code does what its description says, whether a test checks anything, whether a change misread its
task. The fresh context matters: the reviewer has no stake in the work and no memory of the reasons it was done that
way, so it reads what is there rather than what was meant. It costs model calls and time on every review, and it can
be wrong both ways, missing real problems and reporting false ones. It has to be calibrated before it may block.

## Reading the signal

- **A finding**: a problem with its `file:line` and severity. It is a claim until a second pass checks it.
- **Confirmed, plausible or refuted**: the second pass's verdict on each finding. It filters out the false positives.
- **Pass or fail, match or mismatch**: a verdict with the evidence behind it. A refuter tries to disprove that the
  work is done, so a pass from it carries weight.
- **No findings**: the reviewer saw nothing wrong. It does not prove there is nothing wrong.

A reviewer that timed out, ran out of context or returned output that does not follow its schema has reviewed nothing.
Treat it as no signal, never as a pass.
