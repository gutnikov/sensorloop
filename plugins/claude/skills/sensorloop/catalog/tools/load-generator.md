---
title: Load generator
summary: Sends a scripted load to a running service, and reports latency percentiles and errors against thresholds.
sensors: [performance-measure]
layer: project
---

A load generator sends a scripted load to a running service, and reports latency percentiles and errors against
thresholds. It runs against a copy of the service that can take the load, never against production.

## Finding it

Look for load scripts in the repository (k6 scripts, Gatling simulations, a `locustfile.py`) and in CI for a job,
often scheduled, that runs them. That job names the target: a preview or a staging environment.

## Using it

- **Thresholds in the script**: limits on p95 latency and the error rate, so the run fails by its exit code
  (`thresholds` in k6, assertions in Gatling).
- **Run it**: `k6 run <script>`, `locust -f locustfile.py --headless -u <users> -r <rate> --run-time <duration>`, or
  Gatling through its build plugin.
- **Comparable runs**: the same script, load and environment size each time, with the version under test recorded
  beside the result.

Examples: k6, Gatling (JVM), Locust (Python).
