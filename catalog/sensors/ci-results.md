---
title: CI results
type: computational
summary: "Reads the results of the project's CI for a commit: which jobs passed, which failed, and the failing step's log."
signal: "Per required job: passed, failed with the failing step's log, missing or skipped, or no run yet for this commit."
---

Loops read CI results because CI runs outside the agent's session: the agent cannot skip a job or run a different
command. A commit that edits the CI configuration or the tests can still change what is checked, so read such edits
before trusting a pass.

## What it sees

The result of every job CI ran for a given commit, on each combination of its matrix. It sees only what the jobs
check, and only for the commit asked about: a result for an earlier commit says nothing about this one. Repeated runs
of the same commit show which jobs are flaky.

## Reading the signal

Each required job has one of four statuses:

- **Passed**: the job reported an explicit success for this commit.
- **Failed**: the job failed. The signal gives the failing step's log and, in a matrix, the combination that failed.
- **Missing or skipped**: the job did not run, or was skipped. This is not green.
- **No run yet**: CI has not run the job for this commit, or has not finished it. Nothing has been observed yet.

The commit is green only when every required job passed; a failed job that is not required does not make it red. When
a job ran more than once for the same commit, its latest run counts.

A job can fail for reasons outside the change: a runner out of disk space, a network timeout, an outage of a service
the job depends on. Read the failing step's log to tell such a failure from one the change caused.
