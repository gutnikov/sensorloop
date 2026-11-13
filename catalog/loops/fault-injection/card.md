---
title: When a dependency fails
summary: A test makes a dependency slow, time out or go down through a fault proxy, and the agent fixes retries, timeouts and error handling until the code copes.
sensors: [input-fault-injection]
placement: inner
when: Each time the suite runs, locally while the agent works and again in CI, since the fault tests are part of it.
failure: A fault test that fails, because under its fault the code does not do what the spec names, such as retry, fall back, give up within its time budget or return the right error.
next: The agent fixes retries, timeouts and error handling, never the fault tests, and runs them again until they pass. Where the spec names no behaviour for a fault, it asks a person instead of choosing one, and a fault test that has to change goes through a person.
---

## The loop

1. In tests, the application reaches each dependency through a fault proxy instead of directly.
2. A fault test injects one fault into one dependency: it delays the data, stops the data and closes the connection
   after a set time, resets the connection, caps the throughput, or takes the dependency down.
3. It asserts what the code must do under that fault: retry, fall back, give up within its time budget, or return the
   right error. The proxy reports nothing; the test's assertion is the signal.
4. The test's teardown resets the proxy: every dependency is back up, and no fault is left for the next test.
5. When a fault test fails, the agent reads the failure, fixes retries, timeouts and error handling, and runs the
   fault tests again, until they pass.
6. The fault tests run with the suite, locally and in CI. The final run is in CI.

## Why

In ordinary tests a dependency answers fast and never fails, so no test runs the code for retries, timeouts and
error handling. A client with no timeout, or one that swallows the error when the dependency is down, passes all of
them. A fault proxy makes the dependency slow, time out or go down on demand, locally and in CI, and a test shows
whether the code copes.

## Set up

- **A fault proxy** in the local stack and as a service in CI, with one proxy per dependency, each with a name, a
  listen address and the upstream it forwards to, all created when it starts. The test configuration points the
  application at the listen addresses. Toxiproxy is one example: a test adds a toxic through its HTTP API, such as
  `latency`, `timeout`, `reset_peer` or `bandwidth`, and sets a proxy's `enabled` to `false` to take a dependency
  down.
- **One test per fault and dependency**, asserting the behaviour the spec names for that fault, such as "with payments
  2 s slow, checkout answers 503 within 1 s". Where the spec names none, the agent asks a person instead of choosing:
  how the product behaves when a dependency fails is a requirement.
- **A reset in every test's teardown** (`POST /reset` in Toxiproxy). It re-enables all proxies and removes all
  faults, so a failed test does not leave its fault for the next one.
- **One command runs the fault tests** (a tag or a directory), prints each failure as `file:line: message`, such as
  `tests/faults/test_payments.py:41: expected 503 within 1s, got no answer after 30s`, and exits non-zero when any
  test fails.
- **Out of the agent's reach.** While the agent fixes the code, a hook refuses its writes to the fault tests. A fault
  test that has to change goes through a person, and the final run is in CI.
