---
title: Manual probe
type: computational
summary: "Checks one hypothesis on real values: a call in a REPL, a breakpoint in a debugger, a request with an HTTP client."
signal: The value that confirmed or refuted the hypothesis, with the command that produced it.
---

A manual probe is the agent's instrument for exploring: it reaches for one when it does not yet know what to test.

## What it sees

One value, at one moment, for the inputs the agent chose. The probe gets its answer by running the code, not by
reading it, and it answers only the question asked. It leaves no check that runs again, so the agent turns a finding
the change relies on into a test, and removes its debug output before it calls the work done.

## Reading the signal

- **Confirmed**: the value matches the hypothesis. Keep the command that produced it, so the check can be repeated.
- **Refuted**: the value contradicts the hypothesis. The next probe, or a test, starts from the value seen.

A probe can mislead for reasons of its own: it attached to the wrong process, loaded stale code or ran in the wrong
environment. Check that it ran against the code being changed before trusting its value.
