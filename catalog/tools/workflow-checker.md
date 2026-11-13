---
title: CI workflow checker
summary: "Checks the CI workflows themselves: actions not pinned to a commit, permissions wider than needed, untrusted input in commands."
sensors: [structure-check, security-scanner]
layer: project
---

This tool checks the CI workflows themselves: actions not pinned to a commit, permissions wider than needed, untrusted
input pasted into commands. It reads the workflows as code that runs with the project's secrets.

## Finding it

Look in the CI directory (`.github/workflows/` for GitHub Actions), and in CI or the pre-commit config for a step that
already checks it. The checker's config (`.github/actionlint.yaml`, `zizmor.yml`) lists what it ignores.

## Using it

- **Run it**: `actionlint` checks the syntax, the expressions and the shell in each step; `zizmor .github/workflows/`
  reports security findings such as template injection and excessive permissions.
- **Pin actions to a full commit SHA**, with the version in a comment, so a moved tag cannot change what runs.
- **The strictest rules for workflows that run an agent**: the narrowest permissions, only the secrets they need, and
  no untrusted text in their prompt or commands.
- **Before merge**: every change to a workflow is checked in its own pull request.

Examples: actionlint and zizmor (GitHub Actions).
