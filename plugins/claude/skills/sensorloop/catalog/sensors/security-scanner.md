---
title: Security scanner
type: computational
summary: Scans code, history, dependencies or a running app for known security problems and licence breaches.
signal: The rule and its place in the code, a secret's location (never its value), a vulnerable package with its fixed version, or a URL with its alert.
---

Loops read a security scanner because tests rarely catch these problems: a test checks that the code does what it
should, not that it holds up against an attacker or keeps to the project's licences.

## What it sees

Unsafe patterns in the source, secrets in files and in the history, dependencies with known vulnerabilities or
licences outside the allowed list, and the responses of a running app attacked from outside. It finds known problems
only: a flaw that no rule or database describes passes unseen.

## Reading the signal

- **No findings**: nothing known was found in what was scanned. A scanner that could not reach its vulnerability
  database has not checked the dependencies, and its silence is not a pass.
- **A finding**: the rule and its place in the code; a secret's location, never its value; a vulnerable package with
  the version that fixes it; or a URL with its alert.
- **An ignored finding**: a finding the project chose to accept. It does not fail the check while its ignore entry
  holds. Give every entry a reason and an expiry, so that the finding fails the check again when the entry expires.

A secret found in the history stays exposed after it is deleted from the files: revoke it and issue a new one.
