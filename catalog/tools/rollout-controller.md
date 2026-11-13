---
title: Rollout controller
summary: Rolls a release out step by step, checks it against metrics at each step, and rolls it back on failure.
sensors: [smoke-probe, metrics]
layer: system
---

A rollout controller moves traffic from the old version to the new one in steps, checks the new one against metrics
at each step, and rolls back when a check fails. It is part of the deployment platform, found in its configuration
rather than assumed.

## Finding it

- **The deployment manifests**: a `Rollout` resource (Argo Rollouts) or a `Canary` resource (Flagger) beside or in
  place of a plain `Deployment`.
- **The analysis**: an `AnalysisTemplate` in Argo Rollouts, or the metric checks in Flagger, naming the queries and
  their limits.
- **Access** through `kubectl`, and the controller's own plugin or dashboard (`kubectl argo rollouts`).

## Using it

- **Follow a rollout to its end**: `kubectl rollout status deployment/<name>`, or
  `kubectl argo rollouts get rollout <name> --watch`.
- **Compare the new version with the old** under the same traffic, not only with a fixed limit.
- **Set a step with no metric data to stop the rollout**, rather than let it through.
- **Check the rollback itself** (`kubectl rollout undo`, `kubectl argo rollouts abort`): the old version is healthy
  again afterwards.

Examples: `kubectl rollout` (Kubernetes), Argo Rollouts, Flagger; Kayenta for the canary analysis alone (Spinnaker).
