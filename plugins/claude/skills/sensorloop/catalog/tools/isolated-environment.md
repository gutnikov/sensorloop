---
title: Isolated environment
summary: "An environment of its own for each agent run: its own checkout, dependencies, network rules and secrets."
sensors: [isolation-probe]
layer: system
---

Each agent run gets an environment of its own, so the same code gives the same signal and runs side by side do not
collide. How it is built depends on the project and the agent, so it is found in their configuration rather than
assumed.

## Finding it

- **The project's setup**: a dev container (`.devcontainer/devcontainer.json`), Nix files (`flake.nix`,
  `shell.nix`), a Compose file for the services it needs.
- **The agent's sandbox settings**: the paths it may write and the hosts it may reach.
- **Worktrees already in use**: `git worktree list`.

## Using it

- **One checkout per run**: `git worktree add <path> -b <branch>`, removed with `git worktree remove <path>`.
- **Services per environment** (a database, a log store), on their own ports or network, so two runs share no state.
- **Outbound network on an allowlist**: the package registry and the code host, nothing else by default.
- **Only the secrets the task needs**, for test accounts; torn down after the run, with nothing left behind.

Examples: git worktrees, dev containers, Nix, the coding agent's sandbox.
