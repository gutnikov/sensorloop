---
title: Repository state
type: computational
summary: Reads the repository's state and diff directly, instead of taking the agent's word for what changed.
signal: "A named fact about the tree: the files changed, tests whose expected values were edited, conflicts left, commits ahead, a base that moved, a dirty worktree."
---

Loops read the repository's state around unattended runs, around merges of parallel branches, and wherever a change
must not touch certain files, such as the tests.

## What it sees

The tree, its diff against the base, and the branch's place relative to the base. Leftovers show up here too: debug
output, conflict markers, files written by tests. It is cheap and certain, but it says what changed, never whether the
change is right.

## Reading the signal

- **Nothing found**: none of the facts the loop checks for holds, and nothing was left behind.
- **A named fact**: one fact about the tree, with the files it concerns.

Of the named facts, an edited expected value in a test is worth reading first: it can make a failing test pass
without fixing the code.

A read made in the wrong directory or on the wrong branch reports on another tree. Check where it ran before trusting
a result that found nothing.
