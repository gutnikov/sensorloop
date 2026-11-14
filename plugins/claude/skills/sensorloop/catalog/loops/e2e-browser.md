---
title: Walk the feature in a browser
summary: The agent starts the app and walks the feature through a real browser as a user would, which shows a feature broken end to end even when the unit tests pass.
sensors: [browser-run]
when: After the unit tests pass on a change to a feature users reach in a browser, before the agent says it is done; and again in CI, on a fresh server.
failure: "A step of the scenario fails: it does not reach what a user should see, such as a button with no effect or an error where the result should be. In CI, any failed spec."
next: The agent fixes the code and walks the scenario again; when the run fails before its first step, it fixes the run, not the code. When the same step still fails after three rounds, or the cause is outside the code the agent may change, it stops and shows a person the failed step with its evidence. The task is done when the CI run passes, not when the agent's own walk does. A spec the agent changes goes through review, as acceptance tests do.
---

## The loop

1. The agent starts the app with the project's one command, from a production build served locally.
2. It walks the scenario as a user would: open the page, fill in the form, press the button, read the result. A
   browser driver such as Playwright or Puppeteer drives the browser.
3. A step that fails names the screen, the action, the element it looked for and what the agent saw instead: a
   screenshot, the URL, the console errors and the failed requests.
4. The agent fixes the code and walks the scenario again, until every step passes. After three rounds on the same
   failed step, it stops and hands that evidence to a person.
5. A walk of behaviour that has to keep working after this change becomes a spec in the end-to-end suite. The agent
   writes the spec, and it goes through review. The agent's own walk advises; the spec, run in CI, blocks.

A run can fail before its first step: the app did not start, no browser was available, or the run timed out. Such a
failure says nothing about the feature, which was not observed. The agent fixes the run before it changes any code.

## Why

Unit tests and `curl` can pass while the feature still does not work for a user: each part works on its own, but not
together, such as a submit button whose handler is not attached. Walking the scenario through a browser is the first
check that uses the feature the way a user does. Without it, the agent reports done on a feature that is broken end
to end.

## Set up

- **An explicit instruction** to test each feature through the browser as a user would, in the file the agent reads
  its instructions from, such as CLAUDE.md or AGENTS.md. Without it, an agent may stop at unit tests and `curl`.
- **One command starts the app**, so no session spends time finding out how to run it. The browser driver's test
  runner can start the server before the tests and wait until its URL answers (in Playwright, 60 seconds by default);
  a server that is not up by then fails the run.
- **The build users get, not the dev server.** A dev server renders and bundles differently from production, so a
  change can work in one and fail in the other. For example, a page served as static HTML in production may be
  hydrated in development: a change that only works hydrated looks right on the dev server and is broken for users.
  Walk the scenario against a production build, as CI does, and keep the dev server for the edit loop.
- **Fixtures and page objects.** The agent walks the scenario through the fixtures and page objects the spec will
  use, and adds the ones that are missing.
- **Native dialogs in specs.** An agent that drives a browser through a tool may not see a native `alert`, `confirm`
  or `prompt`, so its walk misses a feature that relies on one. Playwright, for one, dismisses such dialogs unless
  the test handles them, so a spec that ignores a `confirm` tests the cancel path. A scenario with a native dialog is
  checked by a spec that handles it, not by a free walk.
- **A feature list kept across sessions.** When long work spans many sessions and a file tracks which features pass,
  the agent marks a feature as passing there only after its walk.
- **Wiring.** The agent walks the scenario locally after the unit tests pass. A CI job runs the suite in a headless
  browser on a fresh server, out of the agent's reach, and prints each failed test with its file, line and the step
  that failed.
