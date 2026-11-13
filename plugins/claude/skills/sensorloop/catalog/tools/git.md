---
title: git
summary: "The repository itself, read through git: the diff, the log, the state of the tree, branches and worktrees."
sensors: [repository-state]
layer: project
homepage: https://git-scm.com/
---

git reads the repository directly: the diff, the log, the state of the tree, its branches and worktrees. The facts
about a change come from it, not from the agent's own account of what it did.

## Finding it

Every project under git has it. `git rev-parse --show-toplevel` names the repository's root, and `git worktree list`
shows the other checkouts of the same repository.

## Using it

- **Machine-readable output**: `git status --porcelain`, `git diff --name-only`, `git diff --numstat`, so a script
  reads facts rather than a summary meant for people.
- **The right base**: compare with the merge base of the target branch (`git diff origin/main...HEAD`), fetched first,
  not with a stale local copy.
- **Read git, not the report**: a hook or a script that wraps git states the fact (tests touched, a dirty tree,
  commits ahead) instead of asking the agent.
- **Leftovers**: `git diff --check` reports conflict markers and whitespace errors left in the change.

Examples: `git diff`, `git status --porcelain`, `git log`, `git worktree`.
