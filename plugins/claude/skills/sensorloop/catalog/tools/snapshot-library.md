---
title: The project's snapshot library
summary: Compares output with an approved reference stored in the repository, and shows the difference when they part.
sensors: [test-runner]
layer: project
---

A snapshot library stores the approved output of the code in the repository, compares each new run with it, and shows
the difference when they part. Which library the project uses is found in its test dependencies, not assumed.

## Finding it

Look in the test dependencies, then for the references themselves: a `__snapshots__` directory beside the tests,
`.snap` or `.approved.` files, or a `testdata` directory of golden files. The project's test command runs the
comparisons.

## Using it

- **Compare**: the comparisons run with the tests, and a mismatch fails its test with a diff of the two outputs.
- **Update only on purpose**: updating a reference (`jest -u`, `cargo insta review`) approves the new output. It is
  never a way to make a failing test pass.
- **No new references in CI**: there, a missing reference fails instead of being written (`jest --ci`), so nothing is
  approved unseen.
- **Review the diff**: a changed reference is part of the change and is read in review like the code. What changes on
  its own (times, random ids, absolute paths) is kept out of it.

Examples: Jest snapshots (JavaScript), insta (Rust), ApprovalTests (several languages), golden files (common in Go).
