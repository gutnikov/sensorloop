---
title: API compatibility check
type: computational
summary: Compares the public interface after a change with a baseline, such as the last release, and reports each difference that breaks a caller.
signal: "One line per break: the endpoint, message or symbol, and what changed in it."
---

Loops read the check because a break is cheap to fix before a release and expensive after it. The baseline it compares
against is the last release or the main branch.

## What it sees

The interface that callers depend on: the description of an HTTP API, the messages that services exchange, the public
symbols of a library. It can also check a running API against its own schema. It sees the form of the interface, not
its behaviour: a response with the same shape and a different meaning passes.

## Reading the signal

- **No breaking change**: every existing caller still fits the new interface. Additions that callers can ignore do
  not fail the check.
- **Breaking changes**: one line per break, naming the endpoint, message or symbol and what changed in it.

The check cannot tell an intended break from an accidental one. An intended break needs a new major version or a
person's explicit approval, not a silenced check.

A check run against the wrong baseline, or with none, has compared nothing useful. Confirm which release or branch it
compared against before trusting a pass.
