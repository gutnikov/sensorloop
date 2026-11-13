---
title: The project's error tracker
summary: Where the project's production errors are grouped into issues, with stack traces, counts and the releases they appear in.
sensors: [error-tracker]
layer: system
---

The error tracker receives the errors the product raises for real users, groups them into issues and counts them by
release. Which service the project uses is found in its code and configuration rather than assumed.

## Finding it

- **The SDK** in the dependency manifest, and its initialisation in the start-up code, with its key from the
  environment.
- **The release setting**: how each event is tagged with the version, usually set at build or deploy time.
- **How the agent reaches it**: the service's API, its command-line client (`sentry-cli`), or its MCP server, with
  a token that may only read.

## Using it

- **Query by release and environment**, sorted by frequency, over a time window.
- **Tag every event with its release, and mark each deploy**, so an issue is tied to the version that runs.
- **Ask about the release that holds a fix**, once it is deployed: the old release says nothing about the fix.

Examples: Sentry (with its MCP server for the agent), Rollbar, Bugsnag.
