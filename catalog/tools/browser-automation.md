---
title: Browser automation
summary: "A library that drives a real browser from a script: it clicks, types and waits, and records screenshots, video and traces."
sensors: [browser-run, screenshot]
layer: project
---

A browser automation library drives a real browser from a test script: it clicks, types and waits as a user would, and
records screenshots, video and traces of the run. Which library the project uses is found in the project, not assumed.

## Finding it

Look in the dev dependencies and for the library's config file (`playwright.config.ts`, for example), then in CI for
the job that runs the browser tests. The config says where the tests live, which browsers run, and how the app is
started for them.

## Using it

- **Start the app from the test config** (Playwright's `webServer` setting, for example), so a local run and CI start
  it the same way and wait for it to answer.
- **Locate elements by role and name**: `getByRole('button', { name: 'Save' })` rather than a CSS path, so the test
  finds what a user and assistive technology would find.
- **No retries when looking for flakiness**: retries off and each test repeated (`--retries=0 --repeat-each=10` in
  Playwright).
- **Keep the evidence**: a trace, a screenshot or a video of each failed run; screenshots compared against approved
  images (`toHaveScreenshot`).

Examples: Playwright (several languages), Puppeteer (JavaScript), Cypress (JavaScript), Selenium (several languages).
