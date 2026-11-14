---
title: Logs
type: computational
summary: Queries the logs of a run or a release, and reports the errors in them, grouped and counted.
signal: The errors that are new since the change or more frequent than before it, each with its source and count; or none.
---

Loops read the logs because many failures never reach an exit code: an error is caught and logged, and the run
carries on. They read them during a test run, and after a release.

## What it sees

The errors the code logged, in the runs and releases a query covers. It needs structured logs and a store to query
them in. Locally, a store per worktree keeps one change's logs apart from another's; after a release, the version on
every line lets the same query compare the new version with the previous one. It cannot see a failure that was never
logged, nor a code path that did not run in the period it read.

## Reading the signal

- **None since the change**: no new error appeared, and no known error grew, in the version and period the query
  covered.
- **A new error**: a group that did not occur before the change, with its source and count. The change has to account
  for it.
- **A known error whose count grew**: an existing problem the change made more frequent. Compare counts over the same
  period and the same traffic.

**None since the change** is not a clean log when the query found no lines at all: the store was unreachable, the run
wrote nowhere, or the version was missing from the lines. Check that the query matched the run's own lines before
reading it as a pass.
