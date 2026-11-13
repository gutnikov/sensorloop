---
title: Type check and build
summary: After an edit, the agent runs the type checker and the build, and fixes each error at its file and line until both are clean.
sensors: [build-and-types]
when: After each edit (the type checker, or the language server's diagnostics), and before the turn ends (the build).
failure: Any type or compile error, and any new suppression of one, such as an ignore comment or a cast to an untyped value.
next: The agent fixes the code, never the types or the checker's settings, and checks again. After five rounds in which the errors do not fall, or at once when the error is outside the code it may change, it stops and hands back the last output.
---

## The loop

1. The agent edits code.
2. It runs the type checker; where the language has none, the build.
3. It reads each error with its file and line, and fixes the code.
4. It runs the check again, until it reports nothing or the stop condition below holds.
5. Before the turn ends, the incremental build runs, so a turn cannot end on code that does not build.

The stop condition: five rounds in which the number of errors did not fall, or an error outside the code the agent
may change, such as a missing dependency, a broken toolchain or generated code. Editing code cannot fix those, and
more rounds only spend time.

## Why

Code that does not build cannot be tested or run, so every later check waits on this one. A type checker finds a
mismatch in seconds without running the code, where a test, or a user, would find it later. The exit code says
plainly when the work is done.

## Set up

- **One check command and one build command**, written down where the agent reads its instructions. Examples:
  `tsc --noEmit` (TypeScript), `mypy` or `pyright` (Python), `cargo check` (Rust), `go build ./...` (Go).
- **Strict mode.** The checker's strictest set of checks is on. Upgrading the checker can bring new errors, so it is a
  change of its own.
- **Data parsed at the boundaries.** A request, a file or an API response is parsed into a typed value where it
  enters, so the code behind it has types the checker can trust.
- **Suppressions count as errors.** A new ignore comment or cast in the diff is reported like a type error; one the
  project accepts carries its reason on the same line.
- **Incremental, with warm caches**, so the build is fast enough to run on every turn instead of once at the end.
- **Wiring.** A hook after each edit runs the checker and shows the agent the errors; a hook before the turn ends runs
  the build; CI builds from a clean checkout, out of the agent's reach. The checker's and the build's settings are
  protected: a looser setting is a change a person approves, not a fix.
