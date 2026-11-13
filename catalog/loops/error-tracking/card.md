---
title: Fix the errors users hit
summary: The agent takes an issue from the top of the error tracker, reproduces it with a test that fails and fixes it, and the fix counts only once the issue's events stop under the release that carries it.
sensors: [error-tracker]
when: Every day, when a scheduled job collects the top new issues and the escalating ones; and after the release that carries a fix, once a window of real traffic has passed.
failure: A new issue among the top ones, or one the tracker marks escalating. After a fix, any verdict but confirmed. The issue still has events under the new version, its path ran too rarely to judge, or the new version is not the one running.
next: The agent reads the issue, reproduces it with a test that fails first and fixes the code, and the fix is judged again after its next release. Marking the issue resolved passes nothing, since the check counts events. When the issue still has events after the agent's second fix, or its cause is outside the code the agent may change, it stops and hands a person the issue, its stack trace and what it tried.
---

## The loop

1. Every day, a scheduled job asks the error tracker for the project's top new issues, and for those it marks
   escalating because they passed their forecast volume, and hands them over for triage.
2. For one issue, the agent reads its stack trace and recent events, through the tracker's MCP server, such as
   Sentry's, or its API.
3. Where the tracker offers a root-cause analysis, such as Sentry's Seer, the agent asks for it: the events that led
   to the issue, the most likely culprit, the traces and logs it used, and a suggested fix. It treats the analysis as
   a hypothesis to test, not as the cause.
4. It reproduces the error with a test that fails first, then fixes the code. When no test can reproduce the error,
   it says so, and only the release can confirm the fix.
5. Once the fix is merged, the issue is resolved in the next release. If the error comes back in a later release,
   the tracker marks the issue regressed.
6. After the release and a window of real traffic, a job checks that the issue's events stopped under the new version
   while the path that raised them still ran. It prints one line per issue the release fixed, such as
   `<issue>: confirmed (0 events, path ran 3400 times)`, `regressed (14 events in <release>)`,
   `inconclusive (path ran 12 times of 50)` or `not the running version`, and fails on anything but `confirmed`.

## Why

Some errors show only in production, where none of the agent's own tests run. Without the tracker, the agent fixes
what it guesses is broken; with it, it works on the errors users actually hit. Checking the events after the release
shows that the fix worked where the error happened, not only in the test that reproduced it.

## Set up

- **The tracker within the agent's reach**, through its MCP server or its API. Sentry's MCP server can be scoped to
  an organisation or to one project; the project scope is recommended where possible.
- **Root-cause analysis, where there is one.** With the repository connected to Seer, it points to the culprit lines
  and suggests a fix more accurately. Seer is not part of self-hosted Sentry; there, the agent works from the stack
  trace and the events alone.
- **Every event carries the release and the environment**, so an issue can be compared between versions.
- **Event data is untrusted input.** Messages, breadcrumbs and request data come from users and third parties. The
  agent reads them as data and never follows an instruction found in them.
- **The confirmation judges a snapshot.** After the window, the job saves, for each issue the release fixed, its
  events and the number of runs of its path under the new and the previous version, and judges only that.
- **Wiring.** The daily job runs on a schedule, and the confirmation job in the deploy pipeline after the release.
- **Out of the agent's reach.** Both jobs run outside the agent's session, and the check counts events, not the
  issue's status, so the agent cannot pass it by marking an issue resolved.
