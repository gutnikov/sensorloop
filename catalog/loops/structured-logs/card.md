---
title: Read the logs
summary: After running a scenario, the agent queries the structured logs of its own run for errors and fixes the cause, until the query finds none or the agent hands the error to a person.
sensors: [logs]
when: After the agent runs a scenario through the app in its worktree, before it says the work is done; and in CI, after the end-to-end job, against CI's own log store.
failure: An error-level event in the run that is not on the allow-list. A run that left no lines at all in the store fails as well, since then an empty result has observed nothing.
next: The agent reads the events around the error by its request or trace id, fixes the cause and runs the scenario again, until the query finds no errors. When the logs did not hold enough to find the cause, the fix adds the missing field to the log call. The allow-list changes only through review. When the error comes from outside the code the agent may change, or the same error is still there after three rounds, the agent stops and hands a person the error lines with their request ids.
---

## The loop

1. The agent starts the app in its worktree and runs a scenario against it, such as one user journey.
2. It queries the logs of that run for the error-level events since the scenario started, and prints one line per
   distinct error, `<caller>: <message> (<count>)`, where the caller is the event's `file:line`. It fails on any
   error that is not on the allow-list.
3. For one error, it queries the events around it by its request or trace id, and reads their fields: the message,
   the caller and the ids.
4. It finds the cause, fixes it and runs the scenario again, until the query finds no errors. After three rounds with
   the same error, or for an error from code it may not change, it hands the error to a person instead.
5. When the logs did not hold enough to find the cause, the fix also adds the missing field to the log call, and the
   field goes into the logging standards, so later log calls carry it.

An empty result counts only when the run's own lines reached the store: a second query, for every line of the run at
any level since the scenario started, has to return some. A run that wrote nowhere, or a store that was not reached,
has observed nothing.

## Why

When the running app fails, the cause is in its logs, not in the test output. An error that is caught and logged, or
a background job that fails, leaves the scenario's own assertions green. Unstructured logs have to be read line by
line; structured ones can be queried, so the agent goes straight to the error and the events around it.

## Set up

- **Structured logging.** Every line is one JSON object with at least the level, the message, the caller and the
  request or trace id. A lint enforces the format, and the logging standards in the agent's instructions say how to
  write a log call.
- **A log store per worktree**, started with the app and deleted after the task, so the agent reads only its own run.
- **Queries in the store's own language.** Loki takes LogQL, and Elasticsearch its query DSL or ES|QL. VictoriaLogs
  takes LogsQL, a different language from LogQL, at `/select/logsql/query`:
  `curl http://localhost:9428/select/logsql/query -d 'query=_time:5m level:error'` returns the error-level entries
  of the last five minutes as JSON lines; the loop's own query starts where the scenario started instead. Check which
  language the store takes before writing a query.
- **An allow-list of known errors**, in a file that changes only through review.
- **Wiring.** The agent runs the scenario and the query in its worktree. As a gate, CI runs the same after the
  end-to-end job, against its own store, out of the agent's reach.
