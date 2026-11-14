---
title: Fix what fails in CI
summary: The agent pushes, CI runs the checks on clean machines, and the agent fixes what fails; after the second red round, a person takes over.
sensors: [ci-results]
when: After each push, once CI has finished the run for the branch's latest commit.
failure: A required job that failed or was cancelled, or is missing or skipped, for the branch's latest commit.
next: "The agent reads the failing step's log, reproduces the failure locally, fixes the code and pushes again; removing or weakening a job is not a fix. A failure that does not come from the change, such as a job that never ran or a runner out of disk space, is not fixed in the code: the agent hands the branch to a person with the log. After the second red round, it stops and hands over the same way."
---

## The loop

1. The agent runs the cheap checks locally (the linter, the type checker, the tests of the area it changed), and
   pushes.
2. CI runs every check on clean machines. An autofix job runs the formatters and the fixable lint rules and commits
   the result to the branch; the agent pulls it before its next change.
3. The agent reads the run for the branch's latest commit only: its own push, or the autofix commit after it. Where
   the runtime can wake a session on an event, the agent ends its turn after the push and wakes as each check
   finishes, instead of polling.
4. For a job that still fails, the agent reads only the failing step's log. Or a subagent reads the log and returns
   the cause, the lines that show the cause and the next step, so thousands of log lines stay out of the agent's
   context.
5. The agent reruns the failure locally with the command the failure report names, before it reads any code. When
   the failure does not reproduce, it looks for what only its own workspace has, such as a cached package or a
   generated file. Then it fixes the code and pushes again.
6. The loop ends when every required job passes for the branch's latest commit. After the second red round, the agent
   stops and hands the branch to a person with the log.

## Why

Checks in the agent's workspace can pass because of something only that workspace has: a cached package, a
generated file, a local setting. CI runs on clean machines, so a green run there does not depend on the agent's
machine. A CI round takes minutes, so the cheap checks run locally first, and the number of rounds is limited.

## Set up

- **Clean runners.** Each job starts from a fresh runner or container image and installs from the lockfile. Caches
  are keyed by the lockfile's hash and the CI configuration. A pull request's run restores caches and never saves
  them, so code in a pull request cannot put packages into a cache that a release build later restores. A failed or
  timed-out run saves no cache.
- **A failure report that names the local command.** A script watches the run, stops at the first failed job, and
  prints the failures by test file, without stack traces or install noise, then the command that reruns exactly
  those files. The failing step's log alone comes from `gh run view --log-failed` (GitHub Actions) or `glab ci trace`
  (GitLab CI).
- **Capped wake-ups.** Wakes on CI results are capped, for example five in ten minutes and twenty since the person's
  last prompt, so the agent cannot loop on its own.
- **One person steers.** Only the comments of the person who prompts the agent steer it; comments from anyone else,
  bots included, are information.
- **Required checks always report.** A required workflow with a path filter never runs on a pull request outside its
  paths, and the pull request waits for it for good. Skip the heavy steps inside the job instead.
- **A gate that only an explicit success passes.** One required job depends on every check, runs even when one of
  them fails (`if: always()` in GitHub Actions), and fails on anything but success: a skipped or cancelled job is not
  green. Its list of jobs is in the repository, so dropping a check is a diff a person reviews.
- **A clean worktree after every job.** A last step, run even after a failure, fails the job when a file is modified
  or untracked (`git status --porcelain`): a generator, a lockfile resolution or a test wrote into the tree. Each
  such check names its fix in its message.
- **The same rules locally and in CI.** A check keeps the local lint configuration equal to the one CI uses, so a rule
  present only in CI does not cost a round.
- **Out of the agent's reach.** The CI jobs are required checks on the protected branch, so a red run cannot be
  merged. A hook refuses the agent's writes to the workflow files, and a person reviews every change to them.
