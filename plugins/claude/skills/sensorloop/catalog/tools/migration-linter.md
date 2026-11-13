---
title: Migration linter
summary: Checks database migrations for operations that lock tables, lose data or cannot be undone.
sensors: [linter]
layer: project
---

A migration linter reads the project's database migrations before they run, and flags operations that lock a busy
table, lose data or cannot be undone. Which linter fits depends on the database and the migration tool, both found in
the project.

## Finding it

Look for the migrations directory and for the migration tool in the dependencies, then in CI and the pre-commit config
for a linter already run on them. Its config (`.squawk.toml`, `atlas.hcl`) says which rules are turned off.

## Using it

- **New migrations only**: `squawk` on the changed SQL files, or `atlas migrate lint --latest 1` with the project's
  `atlas.hcl`, so migrations already applied are not reported again.
- **Up, down and up again**: each migration is run on a throwaway database in both directions, so the undo is tested,
  not assumed.
- **The production version**: the throwaway database runs the version used in production, since what locks a table
  differs between versions.

Examples: Squawk (PostgreSQL), Atlas, strong_migrations (Ruby on Rails).
