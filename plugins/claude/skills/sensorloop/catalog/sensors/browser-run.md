---
title: Browser run
type: computational
summary: Drives a scripted flow through a page in a real browser, and reports the step that broke.
signal: The failed step with the element it looked for, and the script errors, failed requests and accessibility violations met on the way.
---

A browser run drives a scripted user flow through a running copy of the app in a real browser: it opens pages,
clicks, types and waits for what should appear. Loops read it because it meets the app the way a user does, with
every layer put together.

## What it sees

The page as a user's browser builds it: the DOM, the accessibility tree with each element's role and name, the
console and the network. Finding an element by its role and name doubles as an accessibility check, because a control
that cannot be found that way is also a broken path for assistive technology. It sees only the pages and states the
flow visits, and it sees layout only through screenshots.

## Reading the signal

- **Every step passed**: the flow worked from start to end, on the paths it visits, in this browser.
- **A step failed**: the signal names the step and the element it looked for. The script errors and failed requests
  met on the way often point to the cause.
- **Accessibility violations**: elements the flow met that break accessibility rules, each named. They are findings
  even when every step passed.

A browser run needs the app running. When the app did not start, no browser was available, or the run timed out
before its first step, the run failed and the work was not observed. Read which kind of failure it is before acting
on it.
