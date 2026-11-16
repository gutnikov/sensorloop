# Security

## Reporting a problem

Write to security@invoicer.invalid. Please do not open a public issue.

## What we bring into the project

Every dependency and every extension runs with our permissions, on the accountants' machines or in our own sessions.

**npm packages**: exact versions, from the public registry, with no known HIGH or CRITICAL vulnerability.

**Claude Code plugins, skills and MCP servers** run in every teammate's session once they are in the project's
settings. Before adding one, or moving it to a new version:

- Pin it to a commit (a full SHA), not a branch or a tag.
- Read every file it ships, hooks and scripts included, not only its README.
- No hook that runs on every prompt or every tool call, unless it is limited to the projects it serves.
- No data sent anywhere its README does not say, with a way to turn it off.
