---
title: Manual probe
type: computational
summary: "Checks one hypothesis on real values: a call in a REPL, a breakpoint in a debugger, a request with an HTTP client."
signal: The value that confirmed or refuted the hypothesis, with the command that produced it.
---

A manual probe checks one hypothesis on real values: a call in a REPL, a breakpoint in a debugger, a request with an
HTTP client. It is the agent's instrument for exploring, used when it does not yet know what to test.

## What it sees

One value, at one moment, for the inputs the agent chose. It answers the question asked from the running code rather
than from reading it, and it answers nothing else. It leaves no check that runs again: a finding that matters becomes
a test, and debug output left behind is removed before the work counts as done.

## Reading the signal

- **Confirmed**: the value matches the hypothesis. Keep the command that produced it, so the check can be repeated.
- **Refuted**: the value contradicts the hypothesis. The next probe, or a test, starts from the value seen.

A probe can mislead for reasons of its own: it attached to the wrong process, loaded stale code or ran in the wrong
environment. Check that it ran against the code being changed before trusting its value.
