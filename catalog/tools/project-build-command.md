---
title: The project's build command
summary: Whatever builds this project, found in the project itself rather than assumed.
sensors: [build-and-types]
layer: project
---

The project, not the loop, chooses how it is built. This tool is the command the project already builds with, found in
the project before anything is run.

## Finding it

Look where the project itself builds, in this order:

1. **CI**: the build job a pull request must pass. It is the command the project trusts.
2. **The project's task file**: a `build` script, target or task.
3. **The README or the contributing guide**: the command it tells contributors to run.
4. **The build tool's default**, read off its file (`package.json`, `Cargo.toml`, `go.mod`, `build.gradle`).

When these disagree, CI wins: it decides whether a change is merged. When none of them names a command, ask a person
rather than guess.

## Using it

- **The part that changed, while working**: `cargo build -p <crate>`, `go build ./pkg/...`,
  `bazel build //path:target`. The whole build, as CI runs it, before the work counts as done.
- **The same flags as CI**: warnings that CI treats as errors are errors locally too.
- **Warm caches**: the build and dependency caches kept between runs make it fast enough to run often. A clean build
  now and then, since a stale cache can hide an error.

Examples: `npm run build` (JavaScript), `cargo build` (Rust), `go build ./...` (Go), Gradle (JVM), Bazel.
