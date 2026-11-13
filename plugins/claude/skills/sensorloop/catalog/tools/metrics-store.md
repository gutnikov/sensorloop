---
title: The project's metrics store
summary: Where the project's metrics are kept and queried, with its alert and SLO rules.
sensors: [metrics]
layer: system
---

The metrics store keeps the service's metrics as time series and evaluates its alert and SLO rules. Which one it is
depends on the project's platform, so it is found in its configuration rather than assumed.

## Finding it

- **The monitoring config**: scrape targets (`prometheus.yml`), recording and alert rule files, dashboards kept in
  the repository.
- **SLO definitions**, if any: the specs that generate the SLO's recording and alert rules.
- **How the agent reaches it**: the HTTP API (`/api/v1/query` and `/api/v1/query_range` in Prometheus and the stores
  compatible with it), `promtool`, or an MCP server.

## Using it

- **Query over the HTTP API** with PromQL: `curl -G <server>/api/v1/query --data-urlencode 'query=<expr>'`.
- **Compare versions by a label**, over the same window and the same traffic.
- **Check that a query returns series** before trusting its value: an empty result is no data, not zero.
- **Check rules before they ship**: `promtool check rules <file>` and `promtool test rules <file>`.

Examples: Prometheus (PromQL), VictoriaMetrics; Sloth to generate SLO rules; Alertmanager.
