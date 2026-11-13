---
title: Delivery flow metrics
type: computational
summary: "Measures how work flows through the project over weeks: how long changes wait, how soon they get a first review, how old the backlog is, how much CI costs."
signal: Each metric's recent median against its previous value, flagged when it gets worse by more than a set margin.
---

This sensor measures how work flows through the project over weeks: how long changes wait, how soon they get a first
review, how old the backlog is, how much CI costs. Loops read it to see whether the way work is done is getting slower
or more expensive.

## What it sees

A time series taken from the code host: pull requests, reviews, issues and CI runs, counted and timed. It reads
trends, not single events: one slow review is noise, a median that climbs for weeks is a signal. It sees how long work
takes and what it costs, not why, and not whether the work was any good.

## Reading the signal

- **Within the margin**: each metric's recent median is close to its previous value.
- **Worse by more than the margin**: the metric is flagged. The flag says where the flow slowed, not what caused it.
- **Too few events in the window**: a median of a handful of changes is not a trend. A wider window gives a reading.

Gaps in the data (a limit on the code host's API, a repository renamed, a label that changed meaning) can look like a
change in the flow. Check that the series is complete before acting on a jump.
