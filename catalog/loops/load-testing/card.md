---
title: Load test a preview
summary: The agent runs a load scenario against the preview environment of its change, and when the response time or the error rate goes over its threshold, it finds the bottleneck in the traces and fixes it.
sensors: [performance-measure, traces]
when: After each deploy of a pull request's preview environment, in a CI job, or on a schedule against staging; the agent may also run a scenario against its own preview while it works. The traces are read when a threshold fails.
failure: A threshold of the scenario fails, such as the 95th percentile of response time or the rate of failed requests, and the load tool exits non-zero. A run that did not finish has measured nothing, and fails too.
next: The agent reads the run's report and the traces of the slowest requests, fixes the code and runs the same scenario again; it never changes the thresholds, which a person approves. When the bottleneck is outside the code it may change, such as the size of the environment, or the same threshold still fails after three rounds, it stops and hands a person the report and the trace ids.
---

## The loop

1. The pull request's preview is deployed. A scenario from the repository runs against it with a load tool such as
   k6, Gatling or Locust: a set number of users, ramped up to the expected peak and held there.
2. The thresholds in the scenario decide the result, such as the 95th percentile of response time (p95) and the rate
   of failed requests. k6 exits non-zero when a threshold fails, and Gatling fails the simulation when an assertion
   fails. Locust exits with 1 when any request failed, and a `quitting` listener can set
   `environment.process_exit_code` from the fail ratio or `get_response_time_percentile(0.95)`.
3. The run prints one line per threshold, `<metric>: <value> (threshold <expression>): <status>`, where the status is
   `ok` or `failed`, and exits non-zero when the tool does.
4. On a failure, the agent reads the run's report and the traces of the slowest requests in the run's window. It
   finds the span that takes the time, the trace ids that show it, and the likely cause, such as a missing index, a
   lock or an exhausted pool.
5. The agent fixes the code and runs the same scenario again, until every threshold is `ok`.

The traces point to the cause; only the thresholds decide the result. Another agent can do the reading and return
the span, the trace ids and the cause, without blocking anything.

## Why

A change that is fast for one user can slow down under many, and functional tests never put that load on it. This
loop catches a p95 that degrades under load, and the traces show the agent where the bottleneck is. Without them, the
run shows that the response time got worse, but not where.

## Set up

- **An environment that runs the change alone**: the pull request's preview, or staging with nothing else deployed
  during the run. Never production. Either size it like production, or set the thresholds for the size it has.
- **Scenarios in the repository**, each with its load: users, ramp-up and duration. Hold the expected peak for at
  least five minutes: a shorter run hides exhausted pools and slow leaks.
- **Thresholds in the scenario.** In k6, `http_req_duration: ['p(95)<200']` and `http_req_failed: ['rate<0.01']`;
  in Gatling, `global().responseTime().percentile(95).lt(1000)` and `forAll().failedRequests().percent().lte(5.0)`;
  in Locust, the `quitting` listener. The numbers are the project's decision: from the SLO or, without one, the main
  branch's p95 on the same scenario plus 10%. A person approves any change to them.
- **Traces from the environment**: each service instrumented, and a trace store the agent can query for the run's
  window. Without them, the agent profiles the service instead.
- **The check is tested** with a 10-second scenario against a local stub server. A stub with a 300 ms delay on one
  endpoint fails on p95, and one that returns 500 on 5% of requests fails on the error rate; a stub with neither
  passes.
- **Out of the agent's reach.** A CI job runs the scenarios after each preview deploy, or a scheduled job against
  staging, and that run is the one that counts. A hook refuses the agent's writes to the thresholds, so it cannot
  pass a run by loosening them.
