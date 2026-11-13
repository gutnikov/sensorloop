---
title: Error tracker
type: computational
summary: Reads the errors real users hit, grouped into issues with stack traces and counts, and whether they came back after a fix.
signal: The top issues with their stack traces and frequency; for a fix, whether its issue stopped, came back, or is in a version not yet running.
---

The error tracker reads the errors that real users hit in production, grouped into issues with stack traces and
counts. Loops read it to learn what breaks in the version that is actually running, and to confirm that a fix worked
there.

## What it sees

The errors the running code raises or reports for real users, each grouped with others like it and tied to the release
it came from. Release markers make that tie, so it can say whether a fixed issue stopped, came back, or was fixed only
in a version not yet running. It sees errors, not wrong results: a feature that gives the wrong answer without raising
an error never shows up in it.

## Reading the signal

- **Top issues**: the errors users hit most, each with its stack trace and frequency.
- **Stopped**: the fixed issue has no new events from the release that carries the fix.
- **Came back**: it appeared again after it was marked fixed. The fix was partial, or the error has another cause.
- **In a version not yet running**: the fix is merged but not deployed, so the tracker cannot confirm it yet.

Silence can mean the release reports nothing: the tracker is not set up in it, or its events carry no release. Check
that the running release sends events before reading a quiet issue as fixed.
