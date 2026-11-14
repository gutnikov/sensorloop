---
title: The project's log store
summary: Where the project's logs are kept and queried.
sensors: [logs]
layer: system
---

Which store keeps the logs, and how the agent reaches it, differ from project to project: look both up in the
project's configuration, and do not assume them.

## Finding it

- **Where logs are shipped**: the service's logging config, and the config of the shipper that forwards logs to the
  store (Vector, Fluent Bit, an OpenTelemetry Collector exporter).
- **A local store** in the development setup, such as a service in the Compose file, for runs on the machine.
- **How the agent reaches it**: the store's HTTP API, its command-line client (`logcli` for Loki), or an MCP server
  configured for the agent.

When the configuration names no store, ask a person before setting one up. For runs on the machine, a local store can
be one more service in the development setup.

## Using it

- **Query by labels and a time window**, then filter the text: `{service="api"} |= "error"` in LogQL.
- **Bound every query** by time and a line limit, so a broad query returns.
- **Put the version on every line** of the service's structured logs (one record of named fields per line, such as
  JSON), so the same query separates the new release from the old.
- **Start a store per worktree locally**, so one run's logs do not mix with another's.

Examples: Loki (LogQL), Elasticsearch, VictoriaLogs, CloudWatch Logs (AWS); Vector to ship logs into them.
