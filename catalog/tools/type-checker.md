---
title: The project's type checker
summary: Checks the types of the code without running it, where the language has a checker separate from its build.
sensors: [build-and-types]
layer: project
---

Where a language checks its types with a program separate from its build, this tool is that checker, with the settings
the project gives it. Which checker that is, and how strict, is found in the project, not assumed.

## Finding it

Look in CI and the task file for a type-check step, then for the checker's config (`tsconfig.json`, `mypy.ini`,
`pyrightconfig.json`, or a `[tool.mypy]` or `[tool.pyright]` section in `pyproject.toml`) and its version in the dev
dependencies. Where the compiler checks types as part of the build (Go, Rust, Java), the build is the type check.

## Using it

- **Run it as CI does**: `tsc --noEmit`, `mypy`, `pyright`, with the project's config and strictness, not the
  checker's defaults.
- **The pinned version**: a new release of the checker can find new errors in code that did not change.
- **New suppressions too**: the checker does not report a new `# type: ignore`, `@ts-ignore` or `@ts-expect-error`, so
  they are read from the diff; `mypy --warn-unused-ignores` reports the ones no longer needed.

Examples: `tsc --noEmit` (TypeScript), mypy and Pyright (Python), Sorbet (Ruby).
