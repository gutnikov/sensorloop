---
title: Health endpoints
summary: The addresses a service answers on to say whether it is alive and ready, and the platform's probes that call them.
sensors: [smoke-probe]
layer: system
---

A service's health endpoints say whether it is alive and whether it is ready for traffic, and the platform's probes
call them. Their paths and probes differ per service, so they are found in its code and deployment config rather than
assumed.

## Finding it

- **The deployment config**: `livenessProbe`, `readinessProbe` and `startupProbe` in Kubernetes manifests, a
  `HEALTHCHECK` in the Dockerfile, the load balancer's health check.
- **The service's routes**: `/health`, `/healthz`, `/ready`, or the framework's own (`/actuator/health` in Spring
  Boot).
- **The port** they answer on, which may differ from the service's main port.

## Using it

- **Call them directly** after a start or a rollout: `curl --fail --max-time 5 <url>/ready`.
- **Ask the platform as well**: `kubectl rollout status deployment/<name>` waits until the new pods are ready.
- **Readiness checks the service's own dependencies** (its database, its queue); liveness does not, so an outage of a
  dependency does not restart every replica.

Examples: `/health` and `/ready`, Kubernetes liveness and readiness probes, Docker's `HEALTHCHECK`, Spring Boot
Actuator (Java).
