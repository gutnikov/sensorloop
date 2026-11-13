---
title: Link checker
summary: Follows the links in the project's documents, and reports the ones that lead nowhere.
sensors: [structure-check]
layer: project
---

A link checker follows the links in the project's documents, and reports the ones that lead nowhere: a file that
moved, an anchor that was renamed, a site that is gone.

## Finding it

Look in CI and the task file for a link-check step, and for its config (`lychee.toml`, `.lycheeignore`, a JSON config
for markdown-link-check). It covers the README, the docs directory and, where there is one, the built site.

## Using it

- **Local links on every change**: `lychee --offline` checks links between files in the repository without the
  network; `--include-fragments` checks anchors too.
- **External links on a schedule**: other sites fail on their own, and a change should not fail because of them.
- **Ignore with a reason**: a site that blocks link checkers goes in the ignore file with a comment.
- **The built site too**: links the site generator writes exist only in its output.

Examples: lychee, markdown-link-check (JavaScript).
