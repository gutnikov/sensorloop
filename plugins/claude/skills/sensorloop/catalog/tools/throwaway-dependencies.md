---
title: Throwaway dependencies
summary: Real dependencies (a database, a queue, a cloud API emulator) started in containers for one test run and removed after it.
sensors: [test-runner]
layer: project
---

This tool starts the real dependencies a test needs (a database, a queue, an emulator of a cloud API) in containers
for one test run, and removes them after it. The tests meet the real thing, and every run starts from the same clean
state.

## Finding it

How the project does it is found in the project. Look in the test dependencies for a container library that starts
containers from the test code, and in the repository for a Compose file the tests use. CI shows how the project starts
them and which container runtime it expects; the same runtime must be available wherever the tests run.

## Using it

- **Pin image versions**: a fixed tag or digest, never `latest`, so a run today and a run next month test against the
  same dependency.
- **Wait until ready**: a health check, an open port or a log line, never a fixed sleep.
- **Nothing shared between runs**: a fresh container or a fresh database for each run, removed at the end
  (`docker compose down -v` removes the volumes too).
- **Say when it could not start**: without a container runtime the tests that need one did not run, and that is
  reported, not skipped in silence.

Examples: Testcontainers (several languages), Docker Compose, LocalStack (AWS services).
