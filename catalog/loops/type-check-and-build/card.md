---
title: Type check and build
summary: After an edit, the agent runs the type checker and the build, and fixes each new error at its file and line until neither reports one.
sensors: [build-and-types]
when: After each edit (the type checker, or the language server's diagnostics), and before the turn ends (the build).
failure: A type or compile error the change brings in, and any new suppression of one without its reason on the same line, such as an ignore comment or a cast to an untyped value.
next: The agent fixes the code at each error and checks again. It changes a type only where the type is wrong, and never the checker's settings. It stops and shows a person the error and the last output when the same error is still there after three rounds, or at once when the error is outside the code it may change.
---

## The loop

1. Before its first edit, the agent runs the type checker and the build once. Errors they report then are not its
   doing: it names them in its report and leaves them, unless the task is to fix them.
2. The agent edits code.
3. It runs the type checker; where the language has none, the build.
4. It reads each new error with its file and line, and fixes the code. It tells new errors from old ones by file and
   message, since line numbers move as the code changes.
5. It runs the check again, until it reports no new error or the stop condition below holds.
6. Before the turn ends, the build runs. While it reports a new error, the turn goes on from step 4, until the build
   reports none or the stop condition holds.

The stop condition: three rounds on the same error, or one error outside the code the agent may change, such as a
missing dependency, a broken toolchain or generated code. Editing the code cannot fix such an error, and more rounds
only spend time.

## Why

Code that does not build cannot be tested or run, so every later check waits on this one. A type checker finds a
mismatch in seconds without running the code, where a test, or a user, would find it later. The exit code says
plainly when the work is done.

## Set up

- **One check command and one build command**, written down where the agent reads its instructions. Examples:
  `tsc --noEmit` (TypeScript), `mypy` or `pyright` (Python), `cargo check` (Rust), `go build ./...` (Go).
- **Strict mode.** The checker's strictest set of checks is on. In a codebase that is not yet clean under it, strict
  mode goes on one part at a time (a module or a directory, where the checker allows it), each part a change of its
  own. Upgrading the checker can bring new errors too, so it is also a change of its own.
- **Data parsed at the boundaries.** A request, a file or an API response is parsed into a typed value where it
  enters, so the code behind it has types the checker can trust.
- **Suppressions count as errors.** The checker does not report a new ignore comment or cast, so a search over the
  diff finds them, and each one without its reason on the same line fails the check. A person who reviews the change
  sees every suppression with its reason.
- **Incremental, with warm caches**: the build recompiles only what changed and keeps its caches between runs, so it
  is fast enough to run on every turn instead of once at the end.
- **Wiring.** A hook after each edit runs the checker and shows the agent the errors. A hook before the turn ends runs
  the build and keeps the turn going while it fails; when the same failure comes back a third time, the hook lets the
  turn end and hands it to a person. The hook cannot tell old errors from new ones, so it is wired once the project
  builds clean; until then, the agent tells them apart itself, as in step 1. CI builds from a clean checkout, out of
  the agent's reach.
  The checker's and the build's settings are protected: a looser setting is a change a person approves, not a fix.
