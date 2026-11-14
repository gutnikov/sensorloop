---
title: Read the traces
summary: After running a scenario, the agent queries the traces of its own run for spans that failed or went over budget, and fixes the cause until the same queries return nothing.
sensors: [traces]
when: After the agent runs a scenario through the services it changed, before it says the work is done; and in CI, against CI's own collector and trace store.
failure: A failed span, with the status Error; a span over its user journey's budget; a duration that was not captured; or no traces found for the scenario.
next: The agent opens the trace, fixes the cause and runs the scenario again, until the same queries return nothing; when no traces are found, it fixes the instrumentation first. Budgets change only through a person's review. When the failing span is outside the code the agent may change, or spans still fail after three rounds, whether the same span or others, the agent stops and hands a person the spans with their trace ids.
---

## The loop

1. The agent runs a scenario through the services it changed, such as one user journey, against its own stack. Each
   request leaves a trace: one span for each step of the request, with the step's duration and its status, `Error`
   when the step failed.
2. The agent runs the trace check, which queries the traces of that run for the failed spans and the slow ones, over
   their journey's budget. In TraceQL, `{ status = error }` finds the failed spans and `{ span:duration > 2s }` the
   slow ones; `resource.service.name = "checkout"` narrows either to one service.
3. The check prints one line per span, `<service> <span>: error (<status message>) trace <id>`,
   `<service> <span>: slow 2.4s > 2s trace <id>` or `<service> <span>: duration missing trace <id>`. It fails on any
   line, and on a run that produced no spans.
4. The agent opens the trace, reads the calls around the span, finds the cause and fixes it.
5. It runs the scenario again. The fix holds once the same queries return nothing, on a run that did produce spans.
   After three rounds that still fail, or for a span in code it may not change, it hands the spans to a person
   instead.

No traces found is not a pass: the instrumentation or the export broke, and an empty result has observed nothing.

## Why

When a request is slow or fails, logs and metrics show that something is wrong, but not where. A trace shows each
step of the request as a span, across services, with its time and its status, so one query points to the step that
failed or slowed down. Without it, the agent knows only that the request failed, and has to guess which step to fix.

## Set up

- **The OpenTelemetry SDK in each service**, with the service's name set, and a span's status set to `Error` where
  the operation it tracks fails.
- **A collector and a trace store per worktree**, so the agent queries its own run and no other. The OpenTelemetry
  Collector receives, processes and exports the spans. OpenTelemetry recommends running one, here one per worktree
  for all its services, but sending spans straight to the store is enough to start. Tempo answers TraceQL at
  `GET /api/search`, such as `curl -G -s http://localhost:3200/api/search --data-urlencode 'q={ status=error }'`;
  Jaeger is another store, with its own query API.
- **Span budgets in a file**: for each user journey, the longest a span may take, such as two seconds for every span
  of a critical journey. A person approves them.
- **Tests for the instrumentation itself.** A span that is never emitted, or ends in the wrong order, makes every
  later query wrong without failing anything. An in-memory exporter, behind the same export filter production uses,
  lets a test run a scenario and assert on the finished spans, their order and their parents. The test polls for
  each expected span for up to ten seconds, and runs each case in its own process when the tracing setup is global.
- **Missing is not zero.** The check prints a duration that was not captured as `missing`, and fails on it: a zero
  would pass every budget.
- **Wiring.** The agent runs the scenario and the queries in its worktree. As a gate, CI runs the same scenario and
  queries with its own collector and store, out of the agent's reach, and the budgets change only through review.
