---
title: Health endpoints
summary: The addresses a service answers on to say whether it is alive and ready, and the platform's probes that call them.
sensors: [smoke-probe]
layer: system
---

The paths, the port and the probes differ from one service to the next: look them up in the service's code and
deployment config, and do not assume `/health`.

## Finding it

- **The deployment config**: `livenessProbe`, `readinessProbe` and `startupProbe` in Kubernetes manifests, a
  `HEALTHCHECK` in the Dockerfile, the load balancer's health check.
- **The service's routes**: `/health`, `/healthz`, `/ready`, or the framework's own (`/actuator/health` in Spring
  Boot).
- **The port** they answer on, which may differ from the service's main port.

When the service has no health route, call one of its main paths instead, such as a page or an API call that only
reads, and propose adding the route.

## Using it

- **Wait until the platform reports the new version ready**: `kubectl rollout status deployment/<name>` on
  Kubernetes, `docker compose up --wait` with Compose. A call made before then can reach an old instance, or one that
  is still starting.
- **Then call them directly**: `curl --fail --max-time 5 <url>/ready`. Where the endpoint reports a version, check
  that it is the new one.
- **Read what readiness checks** in the service's code. By convention, readiness (can it take traffic) checks the
  service's own dependencies, such as its database and its queue, and liveness (is it alive) does not, so an outage
  of a dependency does not restart every replica. A readiness route that checks nothing says only that the process
  answers.

Examples: `/health` and `/ready`, Kubernetes liveness and readiness probes, Docker's `HEALTHCHECK`, Spring Boot
Actuator (Java).
