---
title: Accessibility rules engine
summary: Applies accessibility rules (WCAG) to a rendered page, and names the element behind each violation.
sensors: [browser-run]
layer: project
---

An accessibility rules engine applies automated rules, most of them from WCAG, to a page the browser has rendered, and
names the element behind each violation. It catches what a rule can express, which is only part of what a person using
assistive technology would meet.

## Finding it

Look in the dev dependencies for the engine or its package for the project's browser driver, and in the browser tests
for the call that runs it. Its settings (the rule tags it applies, the rules or regions it leaves out) sit beside that
call.

## Using it

- **Run it inside the browser tests**, on each page or state worth checking (`@axe-core/playwright` for Playwright;
  other drivers have their own package).
- **Apply the level the project commits to**, for example the `wcag2a` and `wcag2aa` tags, and keep every exclusion
  with its reason.
- **Keep the selector**: each violation comes back with its rule, its impact and a selector for the element; report
  all three.
- **Snapshot the accessibility tree** of key pages (`toMatchAriaSnapshot` in Playwright), so a lost role or name shows
  as a diff.

Examples: axe-core (inside Playwright or other drivers), accessibility-tree snapshots.
