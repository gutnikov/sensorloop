---
title: LLM reviewer
type: inferential
summary: A separate agent with a fresh context reads a diff, a document or some code against a checklist or a policy, and lists what it finds.
signal: Findings with file:line and severity, or a verdict (pass or fail, match or mismatch) with its evidence.
---

The reviewer runs with read-only tools, so it reports and never changes the work. Loops read it for the problems no
fixed rule can express.

## What it sees

It sees meaning: whether the code does what its description says, whether a test checks anything, whether a change
misread its task. The fresh context matters: the reviewer has no stake in the work and no memory of the reasons it was
done that way, so it reads what is there rather than what was meant.

## Cost and calibration

Every review costs model calls and time, and the reviewer can be wrong both ways: it misses real problems and reports
false ones. A loop lets it block only once it is calibrated: on work a person has already reviewed, its findings agree
with the person's often enough. Until then, its findings are advice.

## Reading the signal

- **A finding**: a problem with its `file:line` and severity. It is a claim until a second pass checks it.
- **Confirmed, plausible or refuted**: the verdict of a second pass, another reviewer with a fresh context that checks
  one finding against the code. It removes many false positives, but it can be wrong too: a confirmed finding is
  strong evidence, not proof. Block on confirmed findings only, and treat a plausible one as advice.
- **Pass or fail, match or mismatch**: a verdict, with its evidence, on whether the work is done or matches what it
  was checked against (its task, a spec, a policy). A refuter is a reviewer asked to prove that the work is not done,
  so a pass from it carries weight.
- **No findings**: the reviewer saw nothing wrong. It does not prove there is nothing wrong.

A reviewer that timed out, ran out of context or returned output that does not follow its schema has reviewed nothing.
Treat it as no signal, never as a pass.
