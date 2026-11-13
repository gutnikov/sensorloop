---
title: CI results
type: computational
summary: "Reads the results of the project's CI for a commit: which jobs passed, which failed, and the failing step's log."
signal: "Per required job: passed, failed with the failing step's log, missing, or no run for this commit."
---

CI results are the outcome of the project's CI for one commit: which jobs passed, which failed, and the failing step's
log. Loops read them as the final run, outside the agent's reach, where the agent cannot change what is checked.

## What it sees

The result of every job CI ran for a given commit, on each combination of its matrix. It sees only what the jobs
check, and only for the commit asked about: a result for an earlier commit says nothing about this one. Repeated runs
of the same commit show which checks are flaky.

## Reading the signal

- **Passed**: every required job reported an explicit success for this commit.
- **Failed**: a job failed. The signal gives the failing step's log and, in a matrix, the combination that failed.
- **Missing or skipped**: a required job did not run or was skipped. This is not green.
- **No run for this commit**: CI has not run, or has not finished. Nothing has been observed yet.

A job can fail for reasons outside the change: a runner out of disk space, a network timeout, a service the job
depends on being down. Read the failing step's log to tell such a failure from a failure of the work.
