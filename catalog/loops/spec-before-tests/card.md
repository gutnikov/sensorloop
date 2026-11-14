---
title: A complete spec before the tests
summary: Each requirement is traced to the spec elements that cover it and the tests that check it, the spec is closed against every gap a test writer would have to guess at, and each functional requirement names the production signal its release is confirmed by.
sensors: [requirement-trace, spec-completeness, human-answer]
when: After every edit to the requirements or the spec, before tests are derived from it; again once the tests are written, and in CI on every pull request that touches the spec or the tests.
failure: A requirement no spec element or test covers, a link to a requirement that does not exist, a broken trace or a table gap in the spec, a test obligation with neither an example nor an open question, or a functional requirement with no production signal and no reason why.
next: The agent closes each gap with a spec element, a row, an example, a tagged test or a question, never with an invented value, and checks again. It asks a person the open questions of one source in one message, and stops for a person to approve the requirements with their trace, and whenever closing a gap would change what an approved requirement means.
---

## The loop

1. Split each source (a ticket, a text) into atomic requirements in the source's words, each with a stable id and its
   kind. What is unclear becomes a question; the agent does not repair the requirement.
2. Write the spec elements the requirements add or change, each listing the requirements it covers. Each functional
   requirement gets its production signal: what shows in production that it happened, the fields that pick it out,
   and how many times a release's window must see it, or why nothing there can show it. A requirement no test can
   observe ("fast", "simple") gets a metric and a threshold, or a question.
3. Run the checks until they report zero errors. For every element touched, pin down each test obligation with an
   example, or turn it into a question.
4. Ask once: all the open questions of the source in one message, grouped, each with what each answer changes in the
   spec. Record every answer in the requirement file and in the spec, and run the checks again.
5. A person approves the requirements with their trace and the delta: the spec elements added, changed and removed.
6. The tests are derived from the spec, one for each example. Each starts from its example's named state, which is a
   test fixture, and is tagged with the ids it checks. A test that depends on an open question is marked
   as known to fail, not guessed. The trace runs again, now with the tests.
7. A requirement is done when every part of it is traced to the spec and a test, every test obligation is pinned down
   or has an open question, and every functional requirement has a production signal. That signal goes to the loop
   that confirms the release in production, which looks for it after the release.

## Why

A spec with a gap does not stay unfinished: the test writer fills the gap with a guess, the coder with another, and
the two agree by chance. Closing a gap in the spec costs a row or a question; closing it after a release costs a fix in
production. The trace keeps one chain from the ticket to production: the requirement, the spec element, the test, and
the signal that confirms the release.

## Where it does not apply

Changes with no requirement behind them: a refactoring, a dependency update, a typo. The tests and the other sensors
check those. Nor a prototype that will be thrown away. A project with no spec in a form a program can check gives the
loop nothing to read until one is set up, and setting one up is a decision for a person.

## Set up

- **The spec and the tests written by different hands.** The agent that writes the spec writes no tests, and the test
  writer reads only the spec, so neither can quietly adjust to the other.
- **Stable ids** on requirements, steps, rules and examples. Tests are tagged with them, and the delta lists by them.
- **Each check shown to catch a broken copy** of the spec before the loop trusts it.
- **When the app and the spec disagree**: for a feature being built, the app is wrong and the spec stays; for a spec
  written from an app that already runs, the spec is corrected, and the delta says so.
- **The same question twice** becomes a rule in the spec, so it is not asked a third time.
- **Wiring.** The agent runs the checks after every edit to the spec. A CI job runs them on every pull request that
  touches the spec or the tests, outside the agent's session. Approval is a person's, recorded in the requirement file
  with who approved and when.
