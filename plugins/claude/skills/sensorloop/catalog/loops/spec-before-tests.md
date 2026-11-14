---
title: A complete spec before the tests
summary: Tests are derived only from a spec with nothing left to guess. Each requirement is traced to the spec elements and tests that cover it, and each functional one names the production signal that confirms it after the release.
sensors: [requirement-trace, spec-completeness, human-answer]
when: After every edit to the requirements or the spec, before tests are derived from it; again once the tests are written, and in CI on every pull request that touches the spec or the tests.
failure: The requirement trace reads anything but Traced, or spec completeness anything but Complete. Nothing checked is a failure too.
next: "The agent closes each finding with a spec element, a table row, an example, a tagged test or an open question, never with an invented value, and runs the checks again. It asks a person the open questions of one source in one message. It stops and hands over to a person at two points: to approve the requirements with their trace, and whenever closing a gap would change the meaning of an approved requirement."
---

## The loop

1. Split each source (a ticket, a text) into atomic requirements in the source's words, each with a stable id, its
   kind (functional, non-functional or a constraint) and the status draft. What is unclear becomes a question; the
   agent does not repair the requirement.
2. Write the spec elements the requirements add or change, each listing the requirements it covers: steps of the
   flow, rules (often decision tables, one row per combination of inputs), examples, and the named states examples
   start from (concrete data, which a test loads as its fixture).
3. Give each functional requirement its production signal: the event or log line that shows in production that the
   behaviour happened, the fields that pick that event out, and how many times it must appear in the window of real
   traffic after a release (`order_paid` with the order's id, at least 50 times); or the reason nothing in production
   can show the behaviour. A non-functional requirement ("fast", "simple") gets a metric and a threshold, or a
   question.
4. Run the checks. Fix each broken trace (a field with no source, or a name that does not exist) and each gap or
   overlap in a table. For every element touched, pin down each test obligation (a case the tests must cover, such as
   a command's success or one of its errors) with an example, or turn it into an open question. Repeat until the
   requirement trace reads Traced and spec completeness reads Complete.
5. Ask once: all the open questions of the source in one message, grouped, each with what its possible answers would
   change in the spec. Record every answer in the requirement file and in the spec, and run the checks again.
6. A person approves the requirements with their trace and the delta: the spec elements added, changed and removed.
   From then on the requirements are approved, and the trace expects a test for each.
7. The test writer, which reads only the spec, derives one test for each example. Each test starts from its example's
   named state and is tagged with the ids it checks. The test writer marks a test that depends on an open question as
   known to fail rather than guessing its result. The trace runs again, now with the tests.
8. A requirement is done when the trace, run with the tests, reads Traced and spec completeness reads Complete. After
   the release, the loop that confirms the release in production looks for each production signal.

## Why

A spec with a gap does not stay unfinished: the test writer fills the gap with a guess, the coder with another, and
the two agree by chance. Closing a gap in the spec costs a row or a question; closing it after a release costs a fix in
production. The trace keeps one chain from the ticket to production: the requirement, the spec element, the test, and
the signal that confirms the release.

## Where it does not apply

Changes with no requirement behind them: a refactoring, a dependency update, a typo. The tests and the other sensors
check those. A prototype that will be thrown away needs no spec either. A project that does not keep its requirements
and spec as files a program can check gives the loop nothing to read until it does, and setting that up is a decision
for a person.

## Set up

- **The spec and the tests written by different hands.** The agent that writes the spec writes no tests, and the test
  writer reads only the spec, so neither can quietly adjust to the other.
- **Stable ids** on requirements, steps, rules and examples. Tests are tagged with them, and the delta lists its
  changes by them.
- **Each check shown to catch a broken copy** of the spec before the loop trusts it: a copy with a field that has no
  source, or with a link to a requirement that does not exist, must fail.
- **When the app and the spec disagree**: for a feature being built, the app is wrong and the spec stays; for a spec
  written from an app that already runs, the agent corrects the spec, and the delta shows the correction.
- **The same question twice** becomes a rule in the spec, so it is not asked a third time.
- **Wiring.** The agent runs the checks after every edit to the requirements or the spec, and again once the tests
  are written. A CI job runs them on every pull request that touches the spec or the tests, outside the agent's
  session. Approval is a person's, recorded in the requirement file with who approved and when.
