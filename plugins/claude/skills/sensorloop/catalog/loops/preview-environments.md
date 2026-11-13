---
title: A preview environment for each change
summary: Every pull request is deployed to an environment of its own, at its own address, so the checks that need a running app test that change alone, before it is merged.
sensors: [smoke-probe, logs, ci-results]
when: On every push to a pull request, once its deploy job has finished; and on a schedule, for environments of pull requests already closed.
failure: The environment is not deployed, runs an older commit than the pull request's head, or is not healthy; or an environment of a merged or closed pull request still runs.
next: The agent reads the deploy job's log or the environment's logs, fixes its change and pushes again; it cannot deploy by hand. A failure in the deploy setup itself, or an environment that stays unhealthy for a cause outside the change, goes to a person with the log.
---

## The loop

1. Each push to a pull request deploys its build to an environment of its own, with its own address.
2. The agent reads the address from the pull request and checks the environment: deployed, running the pull
   request's head commit, and healthy.
3. Once it is ready, the checks that need a deployed app run against it: end-to-end scenarios, a dynamic security
   scan, a page audit, a load test. Each is a loop of its own; this one gives them the address.
4. When a check fails, the agent reads that environment's logs, and only those.
5. Merging or closing the pull request tears the environment down. A scheduled job reports any that still run.

The check prints one line per pull request: `ready <url>`, `not deployed`, `stale (runs <sha>, at <sha>)` or
`unhealthy`, and fails unless the environment is ready.

## Why

Some checks need the app deployed, not just built. Without an environment per change they wait until the change
reaches a shared environment, mixed with other changes, after the merge. With one, each pull request is checked alone
and before it is merged, and the logs the agent reads belong to that change.

## Set up

- **What it deploys** is written in the infrastructure template: the pull request's build of each service the change
  touches, the other services at the main branch's version, and a database of its own seeded from fixtures, never a
  copy of production data.
- **What starts it**: a CI job on every push to the pull request, so the environment always runs the head commit and
  the agent checks what it pushed.
- **The address** is set by the deploy job and written where the agent can read it: a job output or a comment on the
  pull request.
- **The logs** carry the environment's name on every line, so the agent queries only its own.
- **Teardown** on merge or close, and an idle limit (a week, say): an idle environment costs money and nobody looks at
  it. Examples: GitLab review apps, Vercel or Netlify previews, a namespace per pull request in Kubernetes.
- **The job that deploys does not run the pull request's code.** The build runs without secrets; a separate job holds
  the credentials, reads the build as data, and checks it was built for the head commit. A fork's pull request gets no
  preview.
- **For a library or a command-line tool**, the preview is an installable build published under the pull request's
  number, and deleted when the pull request closes.
- **Out of the agent's reach.** The agent can start the deploy job but holds no credentials to deploy by hand, so the
  environment never runs code that is not on the branch. The infrastructure template and the deploy jobs are
  protected: a change to them is reviewed by a person.
