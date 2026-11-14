---
title: Smoke test after a deploy
summary: After each deploy to a preview environment or to staging, a job checks that the new version is ready and runs a few smoke checks against it, and a red result stops the release there.
sensors: [smoke-probe, logs]
when: Right after each deploy to a preview environment or to staging, before the release is promoted to the next stage.
failure: The rollout does not complete, the new version gives no answer or is not healthy within the time limit, or a smoke step fails.
next: The release stops there. The agent reads the new version's startup logs, fixes the cause and deploys again, and the job runs again. When the logs show no cause, or a cause outside the change such as a database that is down, or the check still fails after the agent's second fix, the agent stops and hands a person the failed check and the log lines it read.
---

## The loop

1. The deploy finishes, and the deploy tool reports whether the rollout completed. On Kubernetes,
   `kubectl rollout status` exits 0 once the rollout completes, and non-zero once the deployment passes its progress
   deadline (600 seconds by default); on Amazon ECS, `aws ecs wait services-stable` waits the same way.
2. A job polls the new version's health and readiness endpoints, such as `/health` and `/ready`, every 5 seconds for
   up to 2 minutes. A timeout is red: a slower start is a problem of its own. The job checks which version answered:
   an answer from the previous version counts as no answer.
3. It runs the smoke suite against the new version's address, and prints one line per check, such as
   `/ready: unhealthy after 120s (last 503)`, `/health: no answer after 120s` or
   `smoke login: failed (500 on POST /session)`.
4. Any check that is not healthy stops the release: the change does not go on to the next stage.
5. The agent reads the new version's startup logs, finds the cause, fixes it and deploys again; the job runs again.
6. After a second fix that still fails, or when the cause is not in the change, the agent hands the deploy to a person
   instead of trying again.

A healthy result means that the version starts and answers, not that the change works for users: that is confirmed
in production, once real traffic has reached it.

## Why

A change can pass every test and still fail to start after the deploy, because the tests did not run it where it is
deployed: a required environment variable is missing, or the database cannot be reached. Checking readiness and the
main paths right after the deploy finds this while the change is fresh, before it reaches the next stage, and the
startup logs say why.

## Set up

- **A readiness check that means something.** The readiness check, which tells the platform whether to send the
  version traffic, checks each back end the service cannot work without, such as its database and its queue. The
  liveness check, which tells the platform whether to restart the process, checks only the process. On Kubernetes
  these are the readiness and liveness probes, often at `/ready` and `/health`. A liveness check that fails while the
  database is down restarts every replica, which does not help.
- **A smoke suite of a few checks**: 3 to 10 requests or browser steps over what every release must do (the main page
  loads, a user logs in, the main read and the main write), on a test account, under a minute, run against any
  environment by its base URL. It is not the end-to-end suite: it answers only whether this deploy works at all.
- **Startup logs kept.** The job saves the new version's logs from its start to the verdict, so the agent reads
  exactly those. Reading them never decides the result; the checks do.
- **Wiring.** A step of the deploy pipeline after every deploy to a preview or to staging, before promotion. A deploy
  job with nothing after it is a gap.
- **Out of the agent's reach.** The agent reads the result; it does not run the step. The smoke suite and the polling
  limits are protected, so the agent cannot turn a red deploy green by trimming them.
- **Waiting costs no turns.** When the agent itself waits for a deploy to finish, its wait runs outside the model,
  as a scheduled check or a background command that wakes the agent once, with its output and exit code. A model that
  sleeps and polls pays a turn per poll, and drifts.

## Where it does not apply

Software that users install, such as a package, a binary or an image, has no readiness endpoint: its deploy is a
publish. It is ready when the registry serves it and every dependency it installs, and its smoke test runs the
installed copy, not the workspace.
