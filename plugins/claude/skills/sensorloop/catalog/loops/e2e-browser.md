---
title: Walk the feature in a browser
summary: The agent starts the app and walks the feature through a real browser as a user would, which shows a feature broken end to end even when the unit tests pass.
sensors: [browser-run]
when: After the unit tests pass on a change to a feature users reach in a browser, before the agent says it is done; and again in CI, on a fresh server.
failure: A step of the scenario does not reach what a user should see, such as a button with no effect or an error where the result should be. In CI, any failed spec.
next: The agent fixes the code and walks the scenario again. Done waits on the CI run, not on the agent's own walk, and a spec the agent changes goes through review, as acceptance tests do.
---

## The loop

1. The agent starts the app with the project's one command, from a production build served locally.
2. It walks the scenario as a user would: open the page, fill in the form, press the button, read the result. A
   browser driver such as Playwright or Puppeteer drives the browser.
3. A step that fails names the screen, the action and what the agent saw instead: a screenshot, the URL, the console
   errors and the failed requests.
4. The agent fixes the code and walks the scenario again, until every step passes.
5. A walk that has to keep holding becomes a spec in the end-to-end suite. The agent's own walk advises; the spec,
   run in CI, blocks.

An app that did not start, or a browser that was not there, is a failure of the run, not of the feature: the feature
was not observed.

## Why

Unit tests and `curl` can pass while the feature still does not work for a user: each part works on its own, but not
together, such as a submit button whose handler is not attached. Walking the scenario through a browser is the first
check that uses the feature the way a user does. Without it, the agent reports done on a feature that is broken end
to end.

## Set up

- **An explicit instruction**, where the agent reads its instructions, to test each feature through the browser as a
  user would. Without it, agents tend to test with unit tests and `curl`, and miss features that do not work end to
  end.
- **One command starts the app**, so no session spends time finding out how to run it. The browser driver's test
  runner can start the server before the tests and wait until its URL answers (in Playwright, 60 seconds by default);
  a server that is not up by then fails the run.
- **The build users get, not the dev server.** A dev server renders and bundles differently from production, and a
  change can work in one and not the other: a page served as static HTML in production may be hydrated in
  development, where a change that only works hydrated looks right. Walk the scenario against a production build, as
  CI does, and keep the dev server for the edit loop.
- **Fixtures and page objects.** The agent walks the scenario through the fixtures and page objects the spec will
  use, and adds the ones that are missing.
- **Native dialogs in specs.** An agent driving a browser through a tool may not see a native `alert`, `confirm` or
  `prompt`, and features that rely on them tend to be buggier for it; Playwright dismisses them unless the test
  handles them. A scenario with a native dialog is checked by a spec that handles it, not by a free walk.
- **In long work over many sessions**, a feature is marked as passing only after its walk.
- **Wiring.** The agent walks the scenario locally after the unit tests pass. A CI job runs the suite in a headless
  browser on a fresh server, out of the agent's reach, and prints each failed test with its file, line and the step
  that failed. A spec the agent changes goes through review, as acceptance tests do.
