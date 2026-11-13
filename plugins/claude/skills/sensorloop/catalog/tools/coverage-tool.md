---
title: The project's coverage tool
summary: Whatever measures which lines and branches this project's tests run, with a report other tools can read.
sensors: [coverage-mutants]
layer: project
---

Coverage is measured by a tool tied to the project's language and test framework. This tool is the one the project
already uses, found in the project rather than assumed.

## Finding it

1. **CI**: the job that runs the tests with coverage on, and the report it keeps or uploads.
2. **The task file and the config**: a `coverage` script or target, a coverage section in the test framework's
   config, or the tool's own file (`.coveragerc`, `.nycrc`).
3. **The dependency manifest**: the coverage package among the test dependencies.

When these disagree, CI wins. When none of them names a tool, ask a person before adding one.

## Using it

- **Run the tests with coverage on**, through the project's own test command where it can: for example
  `coverage run -m pytest`, `npx jest --coverage` or `go test -coverprofile=cover.out ./...`.
- **Write a common report format** (LCOV, Cobertura XML), or convert to one, so other tools can read it.
- **Measure the changed lines**, not only the total: a diff-coverage tool reads the report with the diff from the
  main branch.
- **Keep a floor** in the config (`fail_under` in coverage.py, `coverageThreshold` in Jest) that only rises.

Examples: coverage.py (Python), c8 and Istanbul (JavaScript), JaCoCo (Java), `go test -cover` (Go); diff-cover for
the changed lines.
