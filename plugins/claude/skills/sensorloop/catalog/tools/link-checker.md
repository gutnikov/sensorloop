---
title: Link checker
summary: Follows the links in the project's documents, and reports the ones that lead nowhere.
sensors: [structure-check]
layer: project
---

A link checker follows the links in the project's documents, and reports the ones that lead nowhere: a file that
moved, an anchor that was renamed, a site that is gone.

## Finding it

Look in CI and the task file for a link-check step, and for its config (`lychee.toml` and `.lycheeignore` for lychee,
a JSON config for markdown-link-check). A complete step covers the README, the docs directory and, where there is one,
the built site. When there is no step, ask a person before adding one.

## Using it

- **Local links on every change**, without the network: in lychee, `--offline` checks only links between files in the
  repository, and `--include-fragments` checks anchors too.
- **External links in a scheduled CI job**: other sites fail on their own, and a change should not fail because of
  them.
- **Ignore with a reason**: a site that blocks link checkers goes in the ignore list (`.lycheeignore`, or
  `ignorePatterns` in markdown-link-check's config), with the reason in a comment or in the commit that adds it.
- **The built site too**: run the checker on the site generator's output after the build, since the links the
  generator writes exist only there.

Examples: lychee, markdown-link-check (JavaScript).
