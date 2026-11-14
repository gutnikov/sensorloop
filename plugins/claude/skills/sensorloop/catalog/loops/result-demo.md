---
title: Show the result
summary: Once the automated checks pass, the agent shows a person the working feature, with screenshots, a recording or the real output of a command, and the person judges the behaviour, not the code.
sensors: [human-review, screenshot]
when: As the task's last step before the merge, once its automated checks pass; the evidence is checked in CI on the pull request.
failure: The person answers fail, with what differs from what they wanted. Or the evidence check marks a criterion `no evidence`, `text only` (only the agent's description of the result) or `file missing` (a listed file that does not exist).
next: "On a fail, the agent turns what differs into a failing acceptance test, or into a changed requirement the person confirms, then fixes the work and shows it again. If the app does not come up, there is no demo: the agent fixes the deploy, and when the cause is outside its change, or the app still does not come up after three attempts, it stops and hands the person the deploy log. The merge waits for the person's pass, and no answer is not a pass."
---

## The loop

1. The task's automated checks pass. The agent builds and runs the app and looks at the result itself first, so the
   person does not spend time on what the agent could have seen.
2. For each acceptance criterion, it captures evidence with a command: a screenshot of the state, a video of before
   and after, or the command with its real output. The files go in one folder per task, listed in the pull request.
3. The evidence check prints one line per criterion, `<criterion>: <status>`, where the status is `shown`,
   `no evidence`, `file missing` or `text only`, and fails while any criterion is not `shown`.
4. The agent shows the person the working feature: the address of the preview environment with a user to log in as,
   and the evidence.
5. It asks through the session's question tool, with two to four options and the recommended one first: `pass`,
   `fail: <what differs>`, or an answer of their own. It records the evidence shown, the question and the answer.
6. On a fail, the agent writes down what differs before it fixes anything: as a failing acceptance test when the work
   misses the requirement, or as a changed requirement, which the person confirms, when the requirement missed what
   they wanted. Then it fixes the work and shows it again.

A demo shows behaviour, not how the code is built. Where the structure matters, a review of the diff, by another agent
or by a person, goes with it.

## Why

Tests show that the code does what the tests say; they do not show that it is what the person wanted. Seeing the
feature work, the person can judge that in minutes, without reading the code. Real output and recordings, not a
description of what should work, keep the agent from claiming a result it does not have.

## Set up

- **Where it runs** is decided once for the project: the pull request's preview environment or, without one, the app
  started from a clean worktree.
- **Evidence, not claims.** A criterion backed only by the agent's description of it is `text only`. For a video of a
  web app, the browser driver records the run: Playwright with `video: 'on'` writes each test's video to its output
  directory, typically `test-results`, when the browser context closes. A mobile app is recorded with the emulator's
  or simulator's screen recording (`adb shell screenrecord`, `xcrun simctl io booted recordVideo`), and a
  command-line tool with a terminal recorder such as asciinema.
- **One task per demo**, short enough for five minutes of the person's time. A longer demo means the task was too big
  to judge at once.
- **Where the answer goes.** The agent also logs a fail as a correction in the project's outcome log. When a fail of
  the same kind comes back, whoever looks after the loops turns it into a rule: a check, a reviewer's rule or a line
  in the agent's instructions. When the person approves a screenshot as how a screen should look, the agent adds it
  as the approved image of a visual check, in the same pull request, where a reviewer sees it.
- **For a prototype or a spike**, the demo shows its result, and the person's answer is the decision.
- **Out of the agent's reach.** The evidence check runs as a CI job on the pull request, outside the agent's working
  tree. A required approval on the protected branch keeps the agent from merging before the person's pass.

## Where it does not apply

A refactor has no demo: it should not change behaviour, and its check is that the existing tests still pass. A
library or an API change has nothing to show on a screen; a short script that calls it, with its output, is its demo.
