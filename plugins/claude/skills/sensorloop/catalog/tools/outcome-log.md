---
title: Outcome log
summary: "A file in the repository that loops append to: each escape, correction and verdict, with when and where it happened."
sensors: [loop-outcomes]
layer: project
---

The outcome log is a file in the repository that each loop appends to as it runs. It is the project's own file, so
its path is found in the project, never assumed.

## Finding it

- **Where the loops are configured**, or in the project's instructions for agents: the path they write to.
- **In the history**: `git log --follow <path>` shows when it started and which changes wrote to it.

When there is none, a person decides where it lives before any loop writes to it.

## Using it

- **One JSON object per line**, appended, never edited or reordered.
- **Each line names** the time, the phase, the kind (caught, escaped, corrected, a verdict) and the place (a file, a
  commit, a pull request).
- **Committed with the work**, so the record travels with the change it describes.
- **Read with line tools**: `jq -c 'select(.kind == "escape")' <file>`. No secrets and no user data in it.

Examples: an append-only JSON Lines file.
