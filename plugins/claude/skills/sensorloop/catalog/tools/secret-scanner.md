---
title: Secret scanner
summary: Finds credentials in files, staged changes and the git history.
sensors: [security-scanner]
layer: project
---

A secret scanner looks for credentials (keys, tokens, passwords) in the working tree, in the changes about to be
committed, and in the git history. It works the same whatever the stack; the one the project already runs is found
first.

## Finding it

- **A pre-commit hook**: `.pre-commit-config.yaml`, or the project's own hook manager.
- **CI**: a job that scans the pull request's commits or the whole history.
- **Its config and allowlist**: `.gitleaks.toml`, `.gitleaksignore`, or the other scanner's equivalent.
- **The code host's own secret scanning**, when it is turned on.

## Using it

- **Before a commit, scan only what is staged** (`--staged` in Gitleaks).
- **In CI, scan the full history** once, then the new commits of each pull request.
- **Report a secret's place, never its value** (`--redact` in Gitleaks), so the report does not leak it again.
- **A leaked secret is rotated**, not only deleted: it stays in the history and in every clone.
- **Allowlist entries for test fixtures** carry a reason.

Examples: Gitleaks, TruffleHog, detect-secrets.
