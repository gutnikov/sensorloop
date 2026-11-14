---
title: Error tracker
type: computational
summary: Reads the errors real users hit, grouped into issues with stack traces and counts, and whether they came back after a fix.
signal: "The top issues with their stack traces and event counts; for a fix, whether its issue stopped or came back, or whether the fix is not deployed yet."
---

Loops read the error tracker to learn which errors users hit in the release that is actually running, and to confirm
that a fix worked there.

## What it sees

The errors the running code raises or reports for real users. It sees errors, not wrong results: a feature that gives
the wrong answer without raising an error never shows up in it. Each error is grouped with others like it into an
issue, and a release marker ties it to the release it came from. That tie tells whether a fixed issue stopped, came
back, or was fixed only in a release not yet running.

## Reading the signal

The top issues are the errors users hit most, each with its stack trace and event count. For a fix, the issue is in
one of three states:

- **Stopped**: the fixed issue has no new events from the release that carries the fix. Read it only after that
  release has served enough traffic for the error to have shown up before the fix; a rare error needs a longer wait.
- **Came back**: the issue has new events from the release that carries the fix. The fix was partial, or the error
  has another cause. Events from users still on an older release do not count.
- **Not deployed yet**: the fix is merged but no running release carries it, so the tracker cannot confirm it yet.

Silence can also mean that nothing reports: the tracker is not set up in the running release, or its events carry no
release marker. Check that the running release sends events before reading a quiet issue as fixed.
