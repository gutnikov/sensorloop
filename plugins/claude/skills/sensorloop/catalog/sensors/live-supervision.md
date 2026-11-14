---
title: Live supervision
type: human
summary: A person follows the agent's work as it happens, and interrupts when it drifts.
signal: An interruption, followed by a correction as the next instruction.
---

Live supervision is the earliest human signal: a wrong turn is stopped before more work is built on it.

## What it sees

Drift as it starts: a misread task, a wrong approach, a file that should not be touched, effort out of proportion to
the problem. A person sees drift in the agent's steps before any test fails, because they know what was meant.
Supervision sees only the part of the work the person watched. It costs their full attention for as long as they
watch.

## Reading the signal

- **An interruption**: the person stopped the agent. Usually something in its last steps was wrong; sometimes the
  person adds a requirement or changes their mind, which is new input, not an error.
- **The correction that follows**: the next instruction, which says what was wrong and what to do instead. If it only
  says "stop" or "undo that", what was wrong is not yet known, and the agent asks before it goes on.
- **No interruption**: the person saw nothing worth stopping in what they watched. It is not a review of the result.

The agent records each correction with the work. A correction the person makes twice should become a rule another
sensor checks, such as a lint rule or a test, so the person no longer has to watch for that mistake.
