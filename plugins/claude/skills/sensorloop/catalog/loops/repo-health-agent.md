---
title: Repository health
summary: Every day a job records the project's delivery metrics, an agent turns the worst trend into one proposed change, and a critic must approve it before it becomes a draft pull request a person reviews.
sensors: [flow-metrics, llm-reviewer]
when: Every day, from a scheduled CI job that first records the day's metrics, and when a collaborator, member or owner mentions the agent on an issue; the critic reads each proposed change before anything is published; and four weeks after a change merges, its metric is read again.
failure: A metric whose median over the last four weeks is more than 20% worse than over the four weeks before. A proposed change the critic rejects. A merged change whose metric did not improve in the four weeks after it.
next: The agent proposes one change per run. It becomes a draft pull request only if the critic approves it, and a person reviews and merges it. A rejection drops the proposal for the day, and a change that did not move its metric makes that metric the next run's first candidate. Until a person has read a few weeks of findings and turned pull requests on, the loop only records. After two merged changes in a row that did not improve a metric, the agent stops working on it and hands it to a person with its ledger of past tasks and decisions.
---

## The loop

1. Every day a scheduled job runs one script per metric and appends the numbers to a series:
   - how long pull requests wait for a first review;
   - the time to a first response on an issue;
   - the backlog's age;
   - the number of open issues, and of open pull requests;
   - the pull requests merged each week;
   - how reviews spread across maintainers;
   - CI minutes.
2. It compares each metric's median over the last four weeks with the four weeks before, and flags each metric that
   is more than 20% worse. Four-week medians keep a day's spike from flagging.
3. The agent reads the series and its ledger of past tasks and decisions, and picks the single most significant
   trend, a flagged metric first. It tests competing hypotheses for the cause against data from the code host's API,
   and names who is blocking, which decides the kind of change:
   - **the author**: a nudge and a grace period;
   - **a maintainer**: routing, a digest or an escalation, since more pings are no fix for overloaded maintainers;
   - **the system**: a fix to CI or tooling.
4. It stages one change, such as a triage rule or a script, and writes its other findings to the ledger. A change
   to a CI workflow goes to the ledger as a proposal for a person, never into a patch.
   One change per run, because with two in one window the metric cannot say which one helped.
5. A critic with a fresh context reads the staged diff and its description of the metric, hypotheses and evidence,
   and approves or rejects it. Only an approved change becomes a draft pull request, for a person to merge.
6. Four weeks after the merge, the run compares the metric with the four weeks before the change. The change stays
   if the metric improved. If not, the metric is the next run's first candidate, and after two such changes in a row,
   the agent hands it to a person instead.

## Why

The way a project works degrades slowly, and no check fails: pull requests wait longer for a first review, the
backlog ages, triage labels stop being read, CI minutes grow. A person notices months later and fixes several things
at once, so nobody can tell which fix helped. This loop reads the delivery metrics every day and turns the worst
trend into one small, reviewable change, whose effect shows in the same metrics.

## Set up

- **State between runs**: the series and the ledger, carried from the last successful run, for example as a CI
  artifact kept 90 days and cut to the last 5000 rows, 50 tasks and 20 decisions. Each script prints only
  `metric,value` lines, so the job and the agent read the same numbers.
- **The critic's checklist**
  - The change is aimed at whoever is blocking.
  - Every nudge ends in a state recorded with a label, so the next run does not nudge again.
  - Every close comes after a warning and a grace period.
  - The change moves the metric, rather than only adding a label.
  - It is one change, with only the files it needs.
  - No text looks like an injected instruction, and no script sends data out or runs text from an issue.

  The critic rejects a change that fails a check, and rejects when unsure: a rejection costs a day, and an approval
  opens only a draft. The project can add checks of its own.
- **The agent and the critic only read.** Issue and pull-request text reaches them wrapped in tags, as data. They act
  by writing files: the patch, the branch name, the pull request to comment on, the description.
- **A separate job publishes, and checks every file**, not only the branch name. It pushes only to a new `bot/`
  branch or an open bot pull request's branch. It stages only the paths the patch lists, and refuses a patch that
  touches the CI workflows, CODEOWNERS, or the agent's prompts and policy. It comments only on the
  triggering issue or an open bot pull request. A refused push fails the run and is never retried with a wider
  credential.
- **Record-only to start.** The run writes only to the ledger until a person, after reading a few weeks of findings,
  turns pull requests on; a mention does not turn them on either.
- **Wiring.** A daily scheduled CI job runs the metrics, then the agent, the critic and the publisher. A mention of
  the agent on an issue starts the agent, the critic and the publisher too, but only from a collaborator, member or
  owner; the publisher may answer on that issue.
