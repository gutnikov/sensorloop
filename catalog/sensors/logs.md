---
title: Logs
type: computational
summary: Queries the logs of a run or a release, and reports the errors in them, grouped and counted.
signal: One line per distinct error with its source and count, or none since the change.
---

The logs sensor reads what a running system wrote about itself, during a test run or after a release, and reports the
errors in it, grouped and counted. Loops read it because many failures never reach an exit code: an error is caught
and logged, and the run carries on.

## What it sees

The errors the code logged, in the runs and releases a query covers. It needs structured logs and a store to query
them in. Locally, a store per worktree keeps one change's logs apart from another's; after a release, the version on
every line lets the same query compare the new version with the previous one. It cannot see a failure that was never
logged, nor a code path that did not run in the period it read.

## Reading the signal

- **None since the change**: no new error appeared in the version and period the query covered.
- **A new error**: a group that did not occur before the change, with its source and count. The change has to account
  for it.
- **A known error whose count grew**: an existing problem the change made more frequent. Compare counts over the same
  period and the same traffic.

An empty result is not a clean log when the query found no lines at all: the store was unreachable, the run wrote
nowhere, or the version was missing from the lines. Check that the query matched the run's own lines before reading
silence as a pass.
