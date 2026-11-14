---
title: Smoke and health probe
type: computational
summary: Starts the built artifact or reaches the deployed release, and checks that it answers and that its main paths work.
signal: A probe that did not answer, an unhealthy status, or the first smoke step that failed.
---

Loops read this sensor because it checks what ships, not the source tree: code that passes every test can still fail
to start once it is packed, configured and deployed.

## What it sees

Whether the thing that will run actually runs: the packed package installs and starts, the container comes up, the
release answers on its health endpoints after a rollout, a backup restores, a rollback works. It makes few checks and
makes them every time. It sees that the main paths work, not that every feature does.

## Reading the signal

- **Healthy**: every probe answered with a healthy status, and every smoke step passed.
- **No answer**: a probe got no answer in time. The artifact did not start, or the release cannot be reached.
- **Unhealthy or failed**: the artifact runs, but a health check reports a problem or a main path is broken. The
  signal names the first smoke step that failed.

A probe that reached the previous version, or the wrong address, passes or fails without observing the release.
Check which version answered before reading the result.
