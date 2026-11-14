---
title: API diff
summary: Compares an interface description with the one from the last release, and lists the changes that break callers.
sensors: [api-compatibility]
layer: project
---

An API diff compares the description of an interface with the one from the last release, and lists the changes that
would break a caller. Which tool fits depends on how the interface is described; look for the one the project already
uses.

## Finding it

Look in the repository for the interface descriptions: an OpenAPI document, `.proto` files with a `buf.yaml`, a
library's committed API report. Look in CI for a step that compares them with a baseline: the same description on the
main branch or at the last release tag.

When the API exists only in code, generate its description from the code at both versions, or use a tool that reads
the code itself, as cargo-semver-checks does for a Rust crate. When the project has no such step, ask a person before
adding one.

## Using it

- **Compare with the baseline**: `oasdiff breaking <base> <revision>`, `buf breaking --against '.git#branch=main'`,
  `cargo semver-checks` against the last published version, or `api-extractor run` against the committed report.
- **Choose the baseline on purpose**: the last release tag for what callers already have, the main branch for what is
  about to ship.
- **Fail on breaks only**: `oasdiff breaking --fail-on ERR` exits non-zero on a breaking change and leaves additions
  alone. API Extractor cannot tell the two apart: it fails on any change to the committed report, so a person reads
  its diff.

Examples: oasdiff (OpenAPI), `buf breaking` (Protocol Buffers), API Extractor (TypeScript libraries),
cargo-semver-checks (Rust libraries).
