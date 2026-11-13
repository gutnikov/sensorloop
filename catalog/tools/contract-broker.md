---
title: Contract broker
summary: Stores the contracts consumers expect from a service and the provider's verification of each, so a deploy can ask whether it is safe.
sensors: [test-runner]
layer: system
---

A contract broker keeps the contracts each consumer expects from a service, and the provider's verification of each
one. With both in one place, a deploy can ask whether this version is safe to release to that environment.

## Finding it

A service outside the repository, run by the team or hosted. Its address and token are in the project's CI
configuration, where consumer builds publish contracts and provider builds publish results. From anywhere else, the
agent reaches it through the broker's command-line client or its HTTP API.

## Using it

- **Publish**: each consumer build publishes its contracts, with its version and branch.
- **Verify**: the provider's tests fetch the contracts it must honour, replay each one against the provider, and
  publish the result for the provider's version.
- **Before a deploy**: `can-i-deploy`, with the version and the target environment, answers yes or no, with the
  contracts behind the answer.
- **After a deploy**: `record-deployment`, so the next question is checked against what is really running there.

Examples: Pact Broker, PactFlow.
