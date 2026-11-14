---
title: Build and type check
type: computational
summary: Compiles the code or checks its types, and reports each error with its place.
signal: Errors with file:line and a message, and the exit code.
---

Loops read a build and type check early and often: it catches a whole class of mistakes before any test runs.

## What it sees

Whether the code is consistent with itself: names that resolve, types that match, modules that link. It does not run
the code, so it says nothing about whether the code behaves as it should.

It comes at three speeds. A language server reports errors in the file just edited, right after the edit. A type check
covers the whole project. A full build also links the modules, and catches what appears only when they are put
together.

## Reading the signal

- **No errors**: the code builds, or its types check.
- **Errors**: each gives its `file:line` and a message, and the exit code is non-zero. Fix the first error first, as
  later ones often follow from it.

A clean run can hide a new suppression: a comment added by the change that tells the checker to ignore an error. The
run reports nothing for it, so look for such comments in the diff and treat each one as a finding.

A build can also fail for reasons outside the code: a missing dependency, a full disk, a cache in a bad state. Such a
failure says nothing about the change. Its message points to the environment, not to a mistake in the code: a package
that could not be fetched, no space left on the device. Fix the environment and run the check again; do not change
the code to make it pass.
