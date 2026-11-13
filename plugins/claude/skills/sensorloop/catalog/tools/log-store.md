---
title: The project's log store
summary: Where the project's logs are kept and queried, found in its configuration rather than assumed.
sensors: [logs]
layer: system
---

The log store keeps the project's logs and answers queries over them. Which store it is, and how to reach it, depend
on the project, so both are found in its configuration rather than assumed.

## Finding it

- **Where logs are shipped**: the service's logging config, and the shipper's (a Vector or Fluent Bit config, an
  OpenTelemetry Collector exporter).
- **A local store** in the development setup, such as a service in the Compose file, for runs on the machine.
- **How the agent reaches it**: the store's HTTP API, its command-line client (`logcli` for Loki), or an MCP server
  configured for the agent.

## Using it

- **Query by labels and a time window**, then filter the text: `{service="api"} |= "error"` in LogQL.
- **Bound every query** by time and a line limit, so a broad query returns.
- **The version on every line**, in structured logs, so the same query separates the new release from the old.
- **A store per worktree locally**, so one run's logs do not mix with another's.

Examples: Loki (LogQL), Elasticsearch, VictoriaLogs, CloudWatch Logs (AWS); Vector to ship logs into them.
