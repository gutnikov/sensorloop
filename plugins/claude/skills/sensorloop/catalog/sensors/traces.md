---
title: Traces
type: computational
summary: Queries the traces of requests through the system, and reports the spans that failed or took too long.
signal: The service and span that failed or went over its budget, with the trace's id.
---

The traces sensor queries the path each request took through the system, one span per operation, and reports the spans
that failed or took too long. Loops read it to find where in a chain of services a request broke or slowed down.

## What it sees

The outcome and duration of each step of a request, across services, with the trace's id to find it again. It needs
instrumentation in the code and a trace store; in tests, an in-memory exporter lets assertions run on the spans
directly. It sees only what is instrumented and what sampling kept: a call without instrumentation is a gap, and a
trace that was dropped is not there at all.

## Reading the signal

- **Every span within budget**: the requests read finished without error, inside the budget of their user journey.
- **A failed span**: the service and operation where a request broke, with the trace's id to open it.
- **A span over budget**: the step that made a journey slow. A budget per user journey is what turns traces into a
  pass or fail.
- **No traces found** is not a pass. A query that matched nothing has observed nothing.

Missing traces usually mean the instrumentation or the export broke, not the code under it. Check that the run
produced spans before reading their absence as health.
