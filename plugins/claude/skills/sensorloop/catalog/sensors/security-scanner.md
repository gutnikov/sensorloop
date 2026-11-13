---
title: Security scanner
type: computational
summary: Scans code, history, dependencies or a running app for known security problems and licence breaches.
signal: The rule and its place in the code, a secret's location (never its value), a vulnerable package with its fixed version, or a URL with its alert.
---

A security scanner looks for known security problems in the code, its history, its dependencies or a running copy
of the app, and for licences the project does not allow. Loops read it because these problems rarely show in a test
and cost the most once released.

## What it sees

Unsafe patterns in the source, secrets in files and in the history, dependencies with known vulnerabilities or
licences outside the allowed list, and the responses of a running app attacked from outside. It finds known problems
only: a flaw that no rule or database describes passes unseen.

## Reading the signal

- **No findings**: nothing known was found in what was scanned.
- **A finding**: the rule and its place in the code; a secret's location, never its value; a vulnerable package with
  the version that fixes it; or a URL with its alert.
- **An ignored finding**: every ignore entry carries a reason and an expiry, so that it is looked at again.

A secret found in the history stays exposed after it is deleted from the files. A scanner that could not reach its
vulnerability database has not checked the dependencies, and its silence is not a pass.
