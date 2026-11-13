---
title: A clean environment for each task
summary: Each task gets a new environment of its own, which checks its own isolation before the agent starts and is thrown away at the end, so the sensors give the same result for the same code.
sensors: [isolation-probe]
placement: inner
when: At the start of each task, before the agent starts; while it works, on every sandbox process; after teardown; and in CI, on every change to the setup files.
failure: A host that must be blocked answers, or the allowed one does not; the canary or a secret the sandbox was not given is visible inside it; an escape reaches the host; two environments from the same commit collide or give different test results; or something is left after teardown.
next: The agent does not fix the environment, and cannot change the setup files during a task. A failed probe, or a sandbox that cannot start, ends the session instead of letting the agent run without the boundary, and a person fixes the setup, which CI checks again. A leftover that cannot be tied to the task is reported to a person, not deleted.
---

## The loop

1. At the start of a task, one command builds a new environment, starts the app in it on free ports with its own
   database, and prints its address, which is added to the agent's context.
2. The boundary tests itself: a host that must be blocked is refused, and an allowed one, such as the Git host,
   answers. If not, setup fails; a sandbox that cannot start ends the session instead of running it unsandboxed.
3. The session starts with a basic test against the app, which catches what the setup left broken.
4. While the agent works, the env of every sandbox process is read. A canary variable, set where the sandbox starts
   and declared nowhere, or a host secret the sandbox was not given, by name or by value, is a leak.
5. At the end, the app, its containers, its database and its worktree are removed. Any leftover is a failure: pushed
   refs, temporary branches or a merge in progress, worktrees, containers, sandbox processes, files under the task's
   home or temporary directory. A remote sandbox that cannot be tied to the task is reported, not deleted.

## Why

In a shared or reused environment, a test can fail because of something an earlier task left behind, and the agent
chases a fault that is not in its code. A clean environment for each task removes that cause, and lets agents run
side by side without colliding on ports, databases or branches. With no production data or credentials inside, it
also limits what a mistake can damage.

## Set up

- **Pick the form**, and write the choice where the agent reads its instructions: a git worktree with its own instance
  of the app when the app starts locally in seconds; a dev container when the toolchain must be the same on every
  machine; a machine per task, from a warm pool, when the task needs services a laptop cannot run.
- **Nothing shared.** A worktree alone shares the machine's database, ports, caches and stash, and lacks what git
  ignores, so a test that reads a gitignored fixture can silently skip. Each environment has its own database, ports,
  caches, home, temporary directory and telemetry, and no production data or credentials.
- **One writer per branch.** Workflows that change a pull request share one concurrency group and queue; every push
  uses `--force-with-lease` against the commit the run started from. A reused worktree only fast-forwards, when it is
  clean and strictly behind: a hard reset would destroy the agent's unpushed commits.
- **No confirmations only inside a boundary.** A worktree is none: it is a directory on the same machine. The coding
  agent's sandbox may cover shell commands only, not its file tools or hooks. A dev container does not stop a project
  from sending out what is inside it, the agent's credentials included, so its egress is restricted too. Blocked
  traffic is rejected, not dropped, so a probe fails at once.
- **Probes that do not trust the agent.** Only the agent's own key is declared in the sandbox: an extra one hides a
  leak. A real agent, on its cheapest model, is asked to try one escape per prompt (read a planted fake SSH key,
  write outside the working directory or into `.git/hooks`, kill a host process), and the check reads the host, never
  the model's words. A sandbox that commits has `.git` writable but its `config`, `hooks` and `info` read-only.
- **CI checks the setup.** On every change to the setup files, it builds two environments from the same commit, runs
  the quick suite in each and tears both down. It fails on a build error, results that differ between them or from
  the main checkout (skips counted), a shared port or database name, a failed probe or escape, or a leftover.
- **Out of the agent's reach.** The harness builds the environment before the session starts, and a hook refuses the
  agent's writes to the setup files during a task.
