---
title: Page audit
summary: Loads a page and scores its performance, accessibility and best practices, with the audits that cost it points.
sensors: [performance-measure, browser-run]
layer: project
---

A page audit loads a page in a browser and scores its performance, accessibility and best practices, listing the
audits that cost it points. It needs a running copy of the app, usually a preview.

## Finding it

Look for the audit's config in the repository (`lighthouserc.json` or `.lighthouserc.*` for Lighthouse CI) and in CI
for the job that runs it. The config lists the pages, the number of runs and the assertions; the job names the address
it audits.

## Using it

- **Several runs, the median**: scores vary from run to run, so take the median of several (`numberOfRuns` in
  Lighthouse CI).
- **Assertions per page**: a minimum score per category or a limit per metric, so the job fails on what got worse.
- **The same conditions every time**: a preview on the same kind of machine, with the same throttling and nothing else
  heavy running.
- **One page while working**: `npx lighthouse <url> --output=json` audits a single page; `lhci autorun` runs the whole
  config as CI does.

Examples: Lighthouse, Lighthouse CI.
