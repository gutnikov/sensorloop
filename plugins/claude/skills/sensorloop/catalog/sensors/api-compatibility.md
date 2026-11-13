---
title: API compatibility check
type: computational
summary: Compares the public interface of a change with the last release, and reports every change that breaks a caller.
signal: "One line per break: the endpoint, message or symbol, and what changed in it."
---

An API compatibility check compares the public interface of a change with a baseline, the last release or the main
branch, and reports every change that breaks a caller. Loops read it because a break is cheap to fix before a release
and expensive after it.

## What it sees

The interface callers depend on: an HTTP API in its interface description, the messages services exchange, the public
symbols of a library. It can also check a running API against its own schema. It sees the form of the interface, not
its behaviour: a response with the same shape and a different meaning passes.

## Reading the signal

- **No breaking change**: every existing caller still fits the new interface. Additions that callers can ignore do
  not fail the check.
- **Breaking changes**: one line per break, naming the endpoint, message or symbol and what changed in it.
- **An intended break** needs a new major version or an explicit approval, not a silenced check.

A check run against the wrong baseline, or with none, has compared nothing useful. Confirm which release or branch it
compared against before trusting a pass.
