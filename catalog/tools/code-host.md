---
title: The code host
summary: Where the project's pull requests, reviews, checks and protected branches live, reached from the command line or its API.
sensors: [human-review, ci-results, flow-metrics, human-answer]
layer: system
---

The code host is where the project's pull requests, reviews, checks and protected branches live. Its settings decide
which reviews and checks a change needs, and the agent reaches it from the command line or through its API.

## Finding it

The git remote names the host (`git remote -v`). The host's command-line client, logged in, reaches pull requests,
reviews and checks; its API reaches the rest. The rules are in the host's settings and in the repository: branch
protection, a `CODEOWNERS` file, deployment environments.

## Using it

- **Read a pull request**: `gh pr view --comments` and `gh pr checks` on GitHub, `glab mr view` on GitLab.
- **Required reviews and checks**: code owners and branch protection, so nothing merges without the review and the
  checks it needs.
- **A person before a deploy**: a deployment environment with required reviewers holds the deploy until someone
  approves it.
- **History for metrics**: `gh api` or `glab api` returns pull requests with their times, from which flow metrics are
  computed over weeks.

Examples: GitHub (`gh`), GitLab (`glab`).
