---
title: Requirement trace
type: computational
summary: Follows the links from each requirement to the spec elements that cover it and the tests that check it, and back, and reports every requirement, element or test left without one.
signal: Each requirement no spec element or no test covers, each link to a requirement that does not exist, each element or test no requirement asks for, and each functional requirement with no production signal.
---

A requirement can be lost between the ticket and the code with nothing failing: no test fails for a behaviour nobody
wrote down. Loops read the trace to see that every requirement reached the spec and the tests, that nothing was built
that no requirement asked for, and that a release will be able to show each requirement happened.

## What it sees

Links, by id. A **requirement** here is one behaviour or constraint, split from its source (a ticket, a text) in the
source's words, with a stable id and a kind: functional, non-functional or a constraint. A **spec element** is a part
of the spec that tests are derived from: a step of the flow, an example, a named state, a rule. Each element lists the
ids of the requirements it covers, and each test is tagged with the ids of the requirements or examples it checks, so
the trace can be followed both ways.

A **production signal** belongs to each functional requirement: what shows in production that it happened (an event,
a log line), the fields that pick it out, and how many times the window of traffic after a release must see it; or the
reason nothing in production can show it. It carries the trace past the test to the release.

The trace sees whether the links exist, not whether they are right: an element can name a requirement it does not
cover, and only a reader notices. A requirement still in draft may be uncovered; an approved one may not.

## Reading the signal

- **Traced**: every requirement is covered by a spec element and a test, every element and test traces to a
  requirement that exists, and every functional requirement names its production signal or why it has none.
- **An uncovered requirement**: no spec element, or no test, names it. The signal gives its id and its text.
- **A dangling link**: an element or a test names a requirement that does not exist, because it was renamed, removed
  or mistyped.
- **An untraced element or test**: no requirement asks for it. Either it describes an existing app as it is, or it is
  work nobody asked for.
- **A non-functional requirement with no metric**: "fast" or "simple" with no measure and threshold, which no test can
  check.
- **No production signal**: a functional requirement without one, so the release's confirmation cannot tell whether
  it happened.
- **Nothing checked** is not a pass. A trace that found no requirement files, or no links at all, has observed nothing.
