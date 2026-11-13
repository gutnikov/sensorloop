---
title: API diff
summary: Compares an interface description with the one from the last release, and lists the changes that break callers.
sensors: [api-compatibility]
layer: project
---

An API diff compares the description of an interface with the one from the last release, and lists the changes that
would break a caller. Which tool fits depends on how the interface is described, and is found in the project.

## Finding it

Look for the interface descriptions in the repository (an OpenAPI document, `.proto` files with a `buf.yaml`, a
library's committed API report) and in CI for a step that compares them. The baseline is the same description on the
main branch or at the last release tag.

## Using it

- **Compare with the baseline**: `oasdiff breaking <base> <revision>`, `buf breaking --against '.git#branch=main'`, or
  `api-extractor run` against the committed report.
- **Choose the baseline on purpose**: the last release tag for what callers already have, the main branch for what is
  about to ship.
- **Fail on breaks only**: `oasdiff breaking --fail-on ERR` exits non-zero on a breaking change and leaves additions
  alone.

Examples: oasdiff (OpenAPI), `buf breaking` (Protocol Buffers), API Extractor (TypeScript libraries),
cargo-semver-checks (Rust libraries).
