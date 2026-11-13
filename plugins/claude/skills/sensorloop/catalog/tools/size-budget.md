---
title: Size budget
summary: Measures the size of what users download (a bundle, a package, a binary) and fails when it passes its limit.
sensors: [performance-measure]
layer: project
---

A size budget measures what users download (a bundle, a package, a binary) and fails when it grows past its limit. The
tool depends on what the project ships, and is found in the project.

## Finding it

Look for the limits in the repository: a `size-limit` section in `package.json` or a `.size-limit.json` file, a
Statoscope config, or a size check in CI. The build runs first, since its output is what is measured.

## Using it

- **Run it after the build**: `npx size-limit` measures each entry against its limit.
- **The limit lives in the repository**, so raising it is a visible change that is reviewed.
- **Report what made it grow**: `size-limit --why`, or a Statoscope comparison of two builds, names the modules that
  grew.
- **Measure what is sent**: the compressed size (gzip or brotli), when that is what users download.

Examples: size-limit, Statoscope (JavaScript bundles).
