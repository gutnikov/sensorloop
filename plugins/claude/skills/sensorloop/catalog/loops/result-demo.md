---
title: Show the result
summary: Once the automated checks pass, the agent shows a person the working feature, with screenshots, a recording or the real output of a command, and the person judges the behaviour, not the code.
sensors: [human-review, screenshot]
when: As the task's last step before the merge, once its automated checks pass; the evidence is checked in CI on the pull request.
failure: The person answers fail, with what differs from what they wanted; or an acceptance criterion has no evidence a command produced, only the agent's description of it or a file that does not exist.
next: The agent fixes the work and shows it again, and the reason for a fail becomes a failing acceptance test or a changed requirement. If the app does not come up, there is no demo, and the agent fixes the deploy first. The merge waits for the person's pass, and no answer is not a pass.
---

## The loop

1. The task's automated checks pass. The agent builds and runs the app and looks at the result itself first, so the
   person does not spend time on what the agent could have seen.
2. For each acceptance criterion, it captures evidence with a command: a screenshot of the state, a video of before
   and after, or the command with its real output. The files go in one folder per task, listed in the pull request.
3. A check prints one line per criterion, `<criterion>: <status>`, where the status is `shown`, `no evidence`,
   `file missing` or `text only`, and fails while any criterion is not `shown`.
4. The agent shows the person the working feature: the address of the preview environment with a user to log in as,
   and the evidence.
5. It asks through the session's question tool, with two to four options and the recommended one first: `pass`,
   `fail: <what differs>`, or an answer of their own. It records the evidence shown, the question and the answer.
6. On a fail, the reason becomes a failing acceptance test or a changed requirement. The agent fixes the work and
   shows it again.

A demo shows behaviour, not how the code is built. Where the structure matters, a review of the diff, by another agent
or by a person, goes with it.

## Why

Tests show that the code does what the tests say; they do not show that it is what the person wanted. Seeing the
feature work, the person can judge that in minutes, without reading the code. Real output and recordings, not a
description of what should work, keep the agent from claiming a result it does not have.

## Set up

- **Where it runs** is decided once for the project: the pull request's preview environment or, without one, the app
  started from a clean worktree. If it does not come up, there is no demo; the agent fixes the deploy first.
- **Evidence, not claims.** A criterion backed only by the agent's description of it is `text only`. For a video, a
  browser driver records the run: Playwright with `video: 'on'` records each test, and the file appears in the test
  output directory, typically `test-results`, once the browser context closes.
- **One task per demo**, short enough for five minutes of the person's time. A longer demo means the task was too big
  to judge at once.
- **Where the answer goes.** A fail is also logged as a correction, so that one which comes back becomes a rule. A
  screenshot the person approves as how a screen should look becomes the approved image of a visual check.
- **For a prototype or a spike**, the demo shows its result, and the person's answer is the decision.
- **Out of the agent's reach.** The evidence check runs as a CI job on the pull request, outside the agent's working
  tree. A required approval on the protected branch keeps the agent from merging before the person's pass.

## Where it does not apply

A refactor has no demo: it should not change behaviour, and the tests that show that are its check. A library or an
API change has nothing to show on a screen; a short script that calls it, with its output, is its demo.
