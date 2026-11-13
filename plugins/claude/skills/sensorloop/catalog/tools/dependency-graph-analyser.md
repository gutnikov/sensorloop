---
title: Dependency graph analyser
summary: Builds the graph of imports between modules, checks it against the allowed directions, and measures its coupling.
sensors: [linter, dependency-graph]
layer: project
---

This tool builds the graph of imports between the project's modules, checks it against the directions the project
allows, and measures how coupled the modules are. Which one applies depends on the language, and is found in the
project.

## Finding it

Look for its rules in the repository (`.dependency-cruiser.js`, an import-linter section in `pyproject.toml` or
`setup.cfg`, ArchUnit tests among the Java tests) and in CI for the step that runs them. The rules name the layers and
the directions allowed between them.

## Using it

- **Run it**: `depcruise src` for dependency-cruiser, `lint-imports` for import-linter; ArchUnit's rules run with the
  test command.
- **A baseline that only shrinks**: known violations are recorded in the repository (`--output-type baseline` and
  `--ignore-known` in dependency-cruiser, `FreezingArchRule` in ArchUnit), so a new one fails and old ones are removed
  over time.
- **Coupling over time**: cycles, fan-in and fan-out per module saved from each run, on each pull request and on a
  schedule, so the trend can be compared.

Examples: dependency-cruiser (JavaScript), ArchUnit (Java), import-linter (Python), deptrac (PHP).
