---
title: Chaos platform
summary: Injects failures into a running environment (processes killed, network delayed, resources exhausted) while checking that it stays healthy.
sensors: [input-fault-injection]
layer: system
---

A chaos platform runs experiments on a running environment: it kills processes, delays the network or exhausts a
resource, and watches whether the system stays healthy. It belongs to the platform the environment runs on, so it is
found in that platform's configuration rather than assumed.

## Finding it

- **On Kubernetes**: the platform's own resource kinds (`PodChaos` and `NetworkChaos` for Chaos Mesh, `ChaosEngine`
  for LitmusChaos), which `kubectl get crd` lists.
- **In a cloud account**: the provider's fault service and its experiment templates.
- **Experiments in the repository**, as manifests beside the deployment config, reached with rights on staging only.

## Using it

- **Define the steady state first**, in metrics (the error rate, the latency), and check it holds before the
  experiment starts.
- **On staging under load**, never in an environment whose owners have not agreed to it.
- **Abort conditions and a duration** on every experiment, so it stops itself when the steady state breaks.
- **Start small** (one pod, one dependency) and widen the blast radius only after it holds.

Examples: Chaos Mesh and LitmusChaos (Kubernetes), AWS Fault Injection Service (AWS).
