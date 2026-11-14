---
title: Architecture rules
summary: Rules for the direction of imports between layers fail as soon as the agent adds an import that breaks them, and each message describes the layers, so the agent moves the code where it belongs.
sensors: [linter, dependency-graph]
when: After the agent adds or moves an import, at each commit, and in CI as the final run.
failure: An import in a forbidden direction, a new cycle, or a test that imports a module's internals. A new file outside the predefined folders. A count of known violations or a baseline file that grew, a new per-file override, or a disable comment outside the reviewed list. An exception that no longer matches any code.
next: The agent fixes the code the way the rule's text says, such as moving it to the right layer or pointing a test at the module's entry points, and runs the check again; changing a rule, the baseline, the exceptions or the reviewed list is not a fix. It stops and takes the case to a person when it believes a rule is wrong, when its change leaves an exception that matches no code, or when the check still fails after three rounds. The agent never relaxes a rule that stops it.
---

## The loop

1. The agent adds or moves an import.
2. It runs the architecture check: dependency-cruiser (JavaScript, TypeScript), import-linter (Python) or the
   ArchUnit tests (Java).
3. Each violation prints the dependency, `from → to`, with the rule's name and a text that describes the layers. A
   rule `clients-no-services`, for example, keeps the clients folder from importing the services folder. Its text:
   "API clients only wrap calls to outside APIs, and must not depend on the orchestration layer above them. Logic
   that needs a service goes in that service; a client that needs a value from it takes the value as an argument."
4. The agent reads from the text which layer the code belongs in, moves it there, and runs the check again. It moves
   a new file outside the predefined folders into one of them, and points a test that imports internals at the
   module's entry points.
5. When its change leaves an exception that matches no code, the agent hands the entry to a person, who removes it:
   the agent cannot write to the list.

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
- **Tests reach a module only through its entry points.** A test that imports internals breaks whenever those
  internals change, and pins the implementation. A rule lets tests import entry points and their own fixtures, never
  internals, and keeps the fixtures out of shipped code.
- **A text that teaches the layers.** Every rule says what the layer is for and where the code goes instead, and a
  rule for a boundary names the way across it. In dependency-cruiser it is the rule's `comment`, which
  `--output-type err-long` prints with each violation; in ArchUnit, `.because(...)` or `.as(...)`.
- **Old violations do not block new work.** On an existing codebase, today's violations are recorded in a baseline
  and only new ones fail: `--baseline` with `--ignore-known` in dependency-cruiser, `FreezingArchRule` in ArchUnit.
  The agent takes its work from the check's live counts, not from the baseline file.
- **The baseline grows only with a person's approval.** CI fails when a count per file and rule grew, when the
  baseline file grew against the main branch, or when a new per-file override of the rules or a disable comment
  outside the reviewed list appears. The reviewed list names each disable comment a person has approved. After each
  push to the main branch, a job lowers the baseline in one pull request, so fixes do not conflict over it.
- **Without a baseline**, a rule can warn everywhere and fail only in the files a change touches. The agent then
  clears every old violation in the files it touches.
- **The exception list is a ratchet.** An entry that no longer matches any code fails the check, so the list cannot
  outlive the debt it records. Each entry says whether it is intended, or temporary until a migration reaches it.
- **Proved at setup.** A rule that never fires looks the same as one that holds, so a new rule runs three times: on
  the clean tree, where it passes; with a planted violation, where it fails and names the rule; and with the
  violation removed, where it passes again. The planted violation is kept as a fixture, outside the checked code, in
  a test that expects the rule to fail on it.
- **Wiring.** A pre-commit hook and a CI job; the CI run is the final one. A hook refuses the agent's writes to the
  rules, the ArchUnit tests, the baseline, the exception list and the reviewed list of disable comments.
