---
title: Build and type check
type: computational
summary: Compiles the code or checks its types, and reports each error with its place.
signal: Errors with file:line and a message, and the exit code.
---

A build and type check compiles the code, or checks its types without running it, and reports each error with its
place. Loops read it early and often: it catches a whole class of mistakes before any test runs.

## What it sees

Whether the code is consistent with itself: names that resolve, types that match, modules that link. It comes at
three speeds: diagnostics from a language server right after an edit, a type check, and a full build. It does not run
the code, so it says nothing about whether the code behaves as it should.

## Reading the signal

- **No errors**: the code builds, or its types check.
- **Errors**: each gives its `file:line` and a message, and the exit code is non-zero. Fix the first error first, as
  later ones often follow from it.
- **A new suppression**: a comment that tells the checker to ignore an error counts as a finding, even when the run
  passes.

A build can also fail for reasons outside the code: a missing dependency, a full disk, a cache in a bad state. Such a
failure says nothing about the change. Read which kind it is before acting on it.
