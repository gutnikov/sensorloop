---
title: Architecture rules
summary: Rules for the direction of imports between layers fail as soon as the agent adds an import that breaks them, and each message describes the layers, so the agent moves the code where it belongs.
sensors: [linter, dependency-graph]
placement: inner
when: After the agent adds or moves an import, at each commit, and in CI as the final run.
failure: An import in a forbidden direction, a new cycle, a new file outside the predefined folders, a test that imports a module's internals, a count of known violations that grew, a disable comment outside the reviewed list, or an exception that no longer matches any code.
next: The agent moves the code to the layer the rule's text names and runs the check again; changing a rule, the baseline or the exceptions is not a fix. When it believes a rule is wrong, it stops and takes the rule to a person, since a rule is not relaxed by the agent it stops.
---

## The loop

1. The agent adds or moves an import.
2. It runs the architecture check: dependency-cruiser (JavaScript, TypeScript), import-linter (Python) or the
   ArchUnit tests (Java).
3. Each violation prints the dependency, `from → to`, with the rule's name and a text that describes the layers. A
   rule `clients-no-services`, for example, keeps the clients folder from importing the services folder, and its text
   says that API clients must not depend on the orchestration layer above them.
4. The agent reads from the text which layer the code belongs in, moves it there, and runs the check again.

## Why

An import in the wrong direction still builds and runs, so neither the build nor the tests catch it, and each one
blurs the layers a little more. A rule for the direction of dependencies catches the import as soon as the agent adds
it. Its text says where the code goes, so the agent learns the layers instead of guessing.

## Set up

- **Rules for the direction of dependencies.** In dependency-cruiser, a `forbidden` rule with `from` and `to` paths
  for each pair of layers that must not meet, and `circular: true` for cycles. In ArchUnit, `layeredArchitecture()`
  with `whereLayer(...).mayOnlyBeAccessedByLayers(...)`, and `slices().matching(...).should().beFreeOfCycles()`. In
  import-linter, a `layers` or a `forbidden` contract.
- **A rule for where new files go.** In dependency-cruiser, `allowed` rules whose paths are the predefined folders: a
  file outside them matches none and is reported as `not-in-allowed`.
- **Tests reach a module only through its entry points.** A test that imports internals breaks on every refactor and
  pins the implementation. A rule lets tests import entry points and their own fixtures, never internals, and keeps
  the fixtures out of shipped code.
- **A text that teaches the layers.** Every rule says what the layer is for and where the code goes instead, and a
  rule for a boundary names the way across it. In dependency-cruiser it is the rule's `comment`, which
  `--output-type err-long` prints with each violation; in ArchUnit, `.because(...)` or `.as(...)`.
- **Old violations do not block new work.** On an existing codebase, today's violations are recorded and only new
  ones fail: `--baseline` with `--ignore-known` in dependency-cruiser, `FreezingArchRule` in ArchUnit. The baseline
  only shrinks. CI fails a count per file and rule that grew, a baseline file that grew against the main branch, a
  disable comment outside a reviewed list and a new per-file override of the rules. After each push to the main
  branch, a job lowers the baseline in one pull request, so fixes do not conflict over it; the agent picks its work
  from the live counts, not from the file. Without a baseline, a rule can warn everywhere and fail only in the files
  a change touches, which must be left fully clean.
- **The exception list is a ratchet.** An entry that no longer matches any code fails the check, so the list cannot
  outlive the debt it records. Each entry says whether it is intended, or temporary until a migration reaches it.
- **Proved at setup.** A rule that never fires looks the same as one that holds, so a new rule is run on the clean
  tree (pass), with a planted violation (fail, naming the rule) and reverted (pass); the violation stays as its test.
- **Wiring.** A pre-commit hook and a CI job; the CI run is the final one. A hook refuses the agent's writes to the
  rules, the ArchUnit tests, the baseline and the exception list.
