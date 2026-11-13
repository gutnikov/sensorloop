---
title: Read the traces
summary: After running a scenario, the agent queries the traces of its own run for spans that failed or went over budget, and fixes the cause until the same queries return nothing.
sensors: [traces]
when: After the agent runs a scenario through the services it changed, before it says the work is done; and in CI, against CI's own collector and trace store.
failure: A span with the status Error, a span over its user journey's budget, a duration that was not captured, or a scenario that left no traces at all.
next: The agent opens the trace, fixes the cause and runs the scenario again, until the same queries return nothing; when there are no traces, it fixes the instrumentation first. Budgets change only through a person's review. When the failing span is outside the code the agent may change, or the same span still fails after three rounds, it stops and hands a person the spans with their trace ids.
---

## The loop

1. The agent runs a scenario through the services it changed, such as one user journey, against its own stack.
2. It queries the traces of that run for the failed spans and the slow ones. In TraceQL, `{ status = error }` finds
   the failed spans and `{ span:duration > 2s }` the slow ones; `resource.service.name = "checkout"` narrows either
   to one service.
3. It prints one line per span, `<service> <span>: error (<status message>) trace <id>` or
   `<service> <span>: slow 2.4s > 2s trace <id>`, and fails on any line.
4. The agent opens the trace, reads the calls around the span, finds the cause and fixes it.
5. It runs the scenario again. The fix holds once the same queries return nothing, on a run that did produce spans.

A span is one unit of work with its duration and its status, and the status `Error` means the operation it tracks
failed. A scenario that left no traces at all fails as well: the instrumentation or the export broke, and an empty
result has observed nothing.

## Why

When a request is slow or fails, logs and metrics show that something is wrong, but not where. A trace shows each
step of the request as a span, across services, with its time and its status, so one query points to the step that
failed or slowed down. Without it, the agent knows only that the request failed, and has to guess which step to fix.

## Set up

- **The OpenTelemetry SDK in each service**, with the service's name set, and a span's status set to `Error` where
  the operation it tracks fails.
- **A collector and a trace store per worktree**, so the agent queries its own run and no other. The OpenTelemetry
  Collector receives, processes and exports the spans; one alongside the service is recommended, but sending straight
  to the store is enough to start. Tempo answers TraceQL at `GET /api/search`, such as
  `curl -G -s http://localhost:3200/api/search --data-urlencode 'q={ status=error }'`; Jaeger is another store, with
  its own query API.
- **Span budgets in a file**: for each user journey, the longest a span may take, such as two seconds for every span
  of a critical journey. A person approves them.
- **Tests for the instrumentation itself.** A span that is never emitted, or ends in the wrong order, makes every
  later query wrong without failing anything. An in-memory exporter, behind the same export filter production uses,
  lets a test run a scenario and assert on the finished spans, their order and their parents. The test polls for
  each expected span for up to ten seconds, and runs each case in its own process when the tracing setup is global.
- **Missing is not zero.** A duration that was not captured is reported as `missing`, and fails: a zero would pass
  every budget.
- **Wiring.** The agent runs the scenario and the queries in its worktree. As a gate, CI runs the same scenario and
  queries with its own collector and store, out of the agent's reach, and the budgets change only through review.
