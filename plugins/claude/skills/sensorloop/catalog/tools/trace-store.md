---
title: The project's trace store
summary: Where the project's traces are collected and queried, fed by the instrumentation in its code.
sensors: [traces, performance-measure]
layer: system
---

The trace store collects the spans the instrumented code sends, and answers queries about requests as they crossed
the services. The instrumentation and the store depend on the project, so both are found in it rather than assumed.

## Finding it

- **The instrumentation**: an OpenTelemetry SDK in the dependency manifest, and its setup in the service's start-up
  code.
- **Where spans go**: the `OTEL_EXPORTER_OTLP_ENDPOINT` variable, or the exporters in a Collector's config.
- **How the agent reaches the store**: its HTTP API (search with TraceQL in Tempo, the query API in Jaeger), or an
  MCP server.

## Using it

- **Search by service, status and duration**: `{ resource.service.name = "api" && status = error }` or
  `{ duration > 2s }` in TraceQL.
- **Fetch one trace by its id**, to see which span failed or took the time.
- **Sample everything** in tests and checks: a trace that was sampled out was never recorded.
- **In tests, an in-memory exporter** (`InMemorySpanExporter` in the OpenTelemetry SDKs) collects spans, so
  assertions run on them with no store.

Examples: OpenTelemetry SDKs and Collector; Tempo (TraceQL), Jaeger, Zipkin.
