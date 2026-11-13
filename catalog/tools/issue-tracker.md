---
title: The issue tracker
summary: Where bugs, requests and their discussion are kept, with templates that make a report complete.
sensors: [human-review, user-feedback]
layer: system
---

The issue tracker keeps the project's bugs, requests and their discussion. Which one the project uses is found in its
repository and its contributing guide rather than assumed.

## Finding it

- **The README or the contributing guide**: where it tells people to report a bug.
- **Issue templates** in the repository (`.github/ISSUE_TEMPLATE/`, `.gitlab/issue_templates/`).
- **References in commits and branch names**: a key such as `PROJ-123`, or `#123`.
- **How the agent reaches it**: the code host's client (`gh issue`, `glab issue`), the tracker's API, or an MCP
  server.

## Using it

- **Query rather than read everything**: by label, state and date, for example
  `gh issue list --label bug --state open`.
- **A template asks for** the steps, the expected and actual result, and the environment, so a report can be
  reproduced.
- **Link each issue to the change that fixes it**, so either can be found from the other.

Examples: GitHub Issues, GitLab Issues, Jira, Linear.
