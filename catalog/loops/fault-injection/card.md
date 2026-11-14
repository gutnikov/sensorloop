---
title: When a dependency fails
summary: A test makes a dependency slow, time out or go down through a fault proxy, and the agent fixes retries, timeouts and error handling until the code copes.
sensors: [input-fault-injection]
when: Each time the suite runs, locally while the agent works and again in CI, since the fault tests are part of it.
failure: "A failure under a fault: a fault test fails because the code does not do what the spec names for that fault, such as retry, fall back, give up within its time budget or return the right error. A failure of the harness, such as a proxy that did not start, does not count against the code."
next: The agent fixes retries, timeouts and error handling, never the fault tests, and runs them again; after a failure of the harness, it fixes the setup and leaves the code alone. Where the spec names no behaviour for a fault, it asks a person instead of choosing one. A fault test it thinks is wrong goes to a person with the reason, and when the same fault test still fails after three rounds, it stops and hands a person the failure.
---

## The loop

1. In tests, the application reaches each dependency through a fault proxy instead of directly.
2. A fault test injects one fault into one dependency: it delays the data, stops the data and closes the connection
   after a set time, resets the connection, caps the throughput, or takes the dependency down.
3. It asserts what the code must do under that fault: retry, fall back, give up within its time budget, or return the
   right error. The proxy reports nothing; the test's assertion is the signal.
4. The test's teardown resets the proxy: every dependency is back up, and no fault is left for the next test.
5. When a fault test fails, the agent reads the failure, fixes retries, timeouts and error handling, and runs the
   fault tests again, for three rounds at most. A failure of the harness sends it to the setup, not to the code.
6. The fault tests run with the suite, locally and in CI. The final run is in CI.

## Why

In most tests a dependency answers fast and never fails. A mock that raises an error tests what the caller does with
it, but the mock replaces the client, so the client's timeouts, retries and handling of a dropped connection never
run. A client with no timeout passes all of these tests. A fault proxy makes the real dependency slow, time out or go
down on demand, locally and in CI, and a test shows whether the code copes.

## Set up

- **A fault proxy** in the local stack and as a service in CI. Its configuration defines one proxy per dependency,
  each with a name, a listen address and the upstream it forwards to, so all of them exist as soon as the fault proxy
  starts. The test configuration points the application at the listen addresses. Toxiproxy is one example. Its
  faults are called toxics, such as `latency`, `timeout`, `reset_peer` and `bandwidth`; a test adds one through
  Toxiproxy's HTTP API, and sets a proxy's `enabled` to `false` to take a dependency down.
- **One test per fault and dependency**, asserting the behaviour the spec names for that fault, such as "with payments
  2 s slow, checkout answers 503 within 1 s". Where the spec names none, the agent asks a person instead of choosing:
  how the product behaves when a dependency fails is a requirement.
- **A reset in every test's teardown** (`POST /reset` in Toxiproxy). It re-enables all proxies and removes all
  faults, so a failed test does not leave its fault for the next one.
- **One command runs the fault tests** (a tag or a directory), prints each failure as `file:line: message`, such as
  `tests/faults/test_payments.py:41: expected 503 within 1s, got no answer after 30s`, and exits non-zero when any
  test fails.
- **Out of the agent's reach.** While the agent fixes the code, a hook refuses its writes to the fault tests. Only a
  person changes a fault test, and the final run is in CI.
