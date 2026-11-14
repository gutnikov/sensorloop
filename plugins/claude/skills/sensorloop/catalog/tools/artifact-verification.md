---
title: Artifact verification
summary: "Checks what a release ships: checksums, signatures, the architecture of binaries, and the files in a package."
sensors: [structure-check, smoke-probe]
layer: project
---

This tool checks what a release actually ships, not the tree it was built from: a build can pass every test and still
ship a package without a file it needs, or a binary for the wrong architecture. Reading the artifact builds the
Structure check; installing and starting it builds the Smoke and health probe.

## Finding it

Look in the release job in CI and in the release scripts: the step that writes the checksums and signs the artifacts
is where the matching check belongs. The package manifest (the `files` field in `package.json`, `MANIFEST.in`,
`include` in `Cargo.toml`) says what a package should contain.

## Using it

- **Checksums and signatures**: `sha256sum -c` checks against the published checksum file, `gh attestation verify` a
  build attestation on GitHub, `codesign --verify` a macOS binary, `cosign verify` a container image.
- **Architecture**: `file` or `lipo -archs` names the architectures a binary was built for.
- **Contents**: `npm pack --dry-run`, `cargo package --list` or `tar -tf` lists what a package holds, so a missing or
  stray file shows before release.
- **Install and start it**: install the packed artifact in a clean directory or container and run it once, for example
  with `--version`, so a package that does not start shows before release.
- **Read back after upload**: download the published artifact and repeat these checks on it, not on the local copy.

Examples: `sha256sum`, `gh attestation verify`, `codesign` (macOS), `npm pack --dry-run` (JavaScript), cosign
(container images).
