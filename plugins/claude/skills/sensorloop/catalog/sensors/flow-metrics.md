---
title: Delivery flow metrics
type: computational
summary: "Measures how work flows through the project over weeks: how long changes wait, how soon they get a first review, how old the backlog is, how much CI costs."
signal: Each metric's median over a recent window against the window before it, flagged when it gets worse by more than a margin the loop sets.
---

Loops read this sensor to see whether the work is getting slower or more expensive: a drift that builds over weeks
and that no single change shows.

## What it sees

A time series taken from the code host: pull requests, reviews, issues and CI runs, counted and timed. It reads
trends, not single events: one slow review is noise, a median that climbs for weeks is a signal. The loop sets the
window, the margin and the fewest events that make a reading, to suit the project's pace. It sees how long work takes
and what it costs, not why, and not whether the work was any good.

## Reading the signal

- **Within the margin**: each metric's median is close to its value in the window before.
- **Worse by more than the margin**: the metric is flagged. The flag says where the flow slowed, not what caused it.
- **Too few events in the window**: fewer than the loop's minimum, so the median is not a trend. A wider window gives
  a reading.

A break in the data can look like a change in the flow: events missing because the code host's API limit was hit, a
series cut short where a repository was renamed, a label that now counts different work. Before acting on a jump,
check that the series is complete and means the same thing throughout.
