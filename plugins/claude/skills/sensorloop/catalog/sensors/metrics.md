---
title: Metrics and SLOs
type: computational
summary: Queries the service's metrics (error rates, latency, resource use) and compares them with a limit, a service level objective (SLO) or the previous version.
signal: Each metric's value against its limit (ok, over or no data); for an SLO, its burn rate.
---

This sensor reads the numbers a running service reports about itself. Loops read it after a release, where a
regression often shows first as a number that moves.

## What it sees

Aggregates over a window of time: how often requests fail, how long they take, how much the service uses. When it
compares the new version with the previous one, both run under the same traffic (canary analysis), so a difference
belongs to the change and not to the time of day. A metric hides the requests behind it: it says that something got
worse, not which request or which line of code made it so.

## Reading the signal

- **Ok**: the metric stayed within its limit over the window read.
- **Over**: the metric passed its limit, or the new version did worse than the previous one under the same traffic.
- **Burn rate over its threshold**: the error budget, the failures the SLO allows over its period, is being spent too
  fast. At a burn rate of 1 the budget runs out exactly at the end of the period; the loop sets the threshold above
  that. A fast burn spends the budget in hours; a slow burn, left alone, spends it before the period ends.
- **No data** is not ok. A metric that reported nothing has observed nothing.

No data has several causes: the service did not start, its metrics were not collected, or the change renamed a metric.
None of them clears the change. Check that the series exists for the new version before trusting its value.
