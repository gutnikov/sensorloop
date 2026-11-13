---
title: Language server
summary: Gives the agent diagnostics for the file it just edited, before any build.
sensors: [build-and-types]
layer: agent
---

A language server gives the coding agent the diagnostics for the file it last edited, before any build or test runs.
It is the fastest signal the agent has, from the same checker an editor would use.

## Finding it

It is connected to the coding agent through the agent's language-server support, usually a plugin or a setting per
language. The server's binary must be installed and on the `PATH`; the agent's plugin list or its log shows whether
the server started.

## Using it

- **After every edit**: the server reports errors and warnings in the changed file, and in the files that depend on
  it, without a build.
- **The project's settings**: the server reads the project's own config (`tsconfig.json`, `pyproject.toml`, `go.mod`),
  so its errors match those of the type check and the build.
- **Indexing first**: on a large project the server reports little until it has finished loading; an empty list from a
  server still loading is not a result.
- **Not a replacement for the build**: the full type check and build still run before the work counts as done.

Examples: gopls (Go), rust-analyzer (Rust), Pyright (Python), typescript-language-server (TypeScript), clangd (C and
C++).
