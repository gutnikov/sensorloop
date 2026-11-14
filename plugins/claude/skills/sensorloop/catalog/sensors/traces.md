---
title: Traces
type: computational
summary: Queries the traces of requests through the system, and reports the spans that failed or took too long.
signal: The service and span that failed or made its user journey go over budget, with the trace's id.
---

Loops read traces to find where in a chain of services a request broke or slowed down. A trace is the path one
request took through the system, with one span per operation.

## What it sees

The outcome and duration of each step of a request, across services, with the trace's id to find it again. The
sensor needs instrumentation in the code and a trace store; in tests, an in-memory exporter lets assertions run on the
spans directly. It sees only what is instrumented and what sampling kept: a call without instrumentation is a gap,
and a trace that was dropped is not there at all.

Traces give a pass or fail on latency only against a budget: how long each user journey may take, set by the
project. Without budgets, the sensor still reports failed spans, but not slow ones.

## Reading the signal

- **Every journey within budget**: every request the query returned finished without error, inside its journey's
  budget.
- **A failed span**: the service and operation where a request broke, with the trace's id to open it.
- **A journey over budget**: the span that made the journey slow, with the trace's id.
- **No traces found**: not a pass. A query that matched nothing has observed nothing.

Missing traces usually mean the instrumentation or the export broke, not the code being traced. Check that the run
produced spans before reading their absence as health.
