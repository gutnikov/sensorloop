---
title: Requirement trace
type: computational
summary: Follows the links from each requirement to the spec elements that cover it and the tests that check it, and back, and reports every requirement, element or test left without one.
signal: Each approved requirement that lacks a spec element or a test, each link to a requirement that does not exist, each element or test that traces to no requirement, each functional requirement with no production signal, and each non-functional one with no metric and no open question about it.
---

A requirement can be lost between the ticket and the code with nothing failing: no test fails for a behaviour nobody
wrote down. Loops read the trace to see that every requirement reached the spec and the tests, that everything built
was asked for, and that production will be able to show each functional requirement at work after a release.

## What it sees

Links, by id. A **requirement** here is one thing the product must do or respect, split from its source (a ticket, a
text) in the source's words. It has a stable id, a status (draft until a person approves it) and a kind:
**functional** (a behaviour), **non-functional** (a quality such as speed, stated with a metric and a threshold so
that a test can check it) or a **constraint** (a limit the solution must respect, such as a platform or a law). A
**spec element** is a part of the spec that tests are derived from: a step of the flow, an example, a rule, or a named
state (the concrete data an example starts from). Each element lists the ids of the requirements it covers, and each
test is tagged with the ids of the requirements or examples it checks, so the trace can be followed both ways.

A functional requirement also names its **production signal**: an event or a log line that shows in production that
the behaviour happened. The signal gives the fields that pick that event out, and how many times it must appear in the
window of real traffic after a release. After the release, the loop that confirms the release in production counts it
in that window. When nothing in production can show the behaviour, the requirement gives the reason instead, and the
reason takes the place of the signal.

The trace sees whether the links and these fields exist, not whether they are right: an element can name a requirement
it does not cover, and only a reader notices.

## Reading the signal

- **Traced**: every approved requirement is covered by a spec element and a test, every element and test traces to a
  requirement that exists, every functional requirement names its production signal or why it has none, and every
  non-functional one names its metric and threshold, or an open question about them.
- **An uncovered requirement**: an approved requirement that no spec element, or no test, names. The signal gives its
  id and its text. A requirement still in draft may be uncovered; once approved, it must be covered.
- **A dangling link**: an element or a test names a requirement that does not exist, because it was renamed, removed
  or mistyped.
- **An untraced element or test**: no requirement asks for it. Either it describes an existing app as it is, or it is
  work nobody asked for.
- **No production signal**: a functional requirement that names neither a signal nor why it has none, so the loop
  that confirms the release cannot tell whether the behaviour happened.
- **No metric**: a non-functional requirement such as "fast" or "simple" with no metric and threshold, and no open
  question about them, so no test can check it.
- **Nothing checked** is not a pass. A trace that found no requirement files, or no links at all, has observed nothing.
