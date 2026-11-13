---
title: The project's linter and formatter
summary: Whatever lints and formats this project's code, found in the project itself rather than assumed.
sensors: [linter]
layer: project
---

The project chooses its own lint rules and its own format. This tool is whatever already lints and formats its code,
found in the project before anything is run.

## Finding it

Look where the project itself checks its code, in this order:

1. **CI**: the lint and format-check jobs. They are the commands the project trusts.
2. **The project's task file**: a `lint` or `format` script, target or task.
3. **The config files**: `eslint.config.js`, `ruff.toml`, `.golangci.yml`, `.prettierrc` and the like.
4. **The dependencies**: the linter and formatter the project installs, with their versions.

When these disagree, CI wins: it decides whether a change is merged.

## Using it

- **On changed files while working**, fast enough for every edit; on everything in CI.
- **The formatter writes locally and only checks in CI**: `prettier --write` against `prettier --check`, `ruff format`
  against `ruff format --check`, `gofmt -w` against `gofmt -l`.
- **The pinned version**: the same version locally and in CI, or the two disagree about the same code.
- **Custom rules carry their fix in the message**, so whoever reads the finding knows what to change.

Examples: ESLint (JavaScript), Ruff (Python), Clippy (Rust), golangci-lint (Go); Prettier (JavaScript and more), Black
(Python), gofmt (Go).
