---
title: The CI system
summary: Where the project's checks run on every pull request and push, with each job's status and log.
sensors: [ci-results]
layer: system
---

The CI system runs the project's checks on every pull request and push, outside the agent's reach. Which system it
is shows in the repository; it is read through the code host's command-line client or API.

## Finding it

- **The config in the repository**: `.github/workflows/` (GitHub Actions), `.gitlab-ci.yml` (GitLab CI), a
  `Jenkinsfile`, `.circleci/config.yml`.
- **The required checks**: the protected branch's settings on the code host.
- **Access**: the code host's client (`gh`, `glab`), signed in with a token that may read runs and logs.

## Using it

- **The checks of a pull request**: `gh pr checks <number>`, or `glab ci status` on its branch.
- **The failing step's log only**: `gh run view <run-id> --log-failed`, or `glab ci trace <job-id>`.
- **Wait for the run of this exact commit** (`gh run watch <run-id>`): a run for an earlier commit says nothing about
  this one.
- **Slow checks on a schedule**, and a matrix of platforms where the project supports several.

Examples: GitHub Actions, GitLab CI, Jenkins; read with `gh run view --log-failed` or `glab ci`.
