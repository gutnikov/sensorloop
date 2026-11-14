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

Look for the migrations directory and the migration tool among the dependencies. Then look in CI and the pre-commit
config for a linter that already runs on the migrations. Its config (`.squawk.toml`, `atlas.hcl`) says which rules
are turned off.

## Using it

- **New migrations only**: `squawk` on the changed SQL files, or `atlas migrate lint --git-base main` with the
  project's `atlas.hcl`, which lints every migration added since the main branch. Migrations already applied are not
  reported again.
- **Up, down and up again**: beside the linter, a CI job applies each new migration to a throwaway database with the
  project's migration tool, undoes it and applies it again, so the undo is tested, not assumed.
- **The production version**: the throwaway database runs the same version as production, since what locks a table
  differs between versions.

Examples: Squawk (PostgreSQL), Atlas (several databases), strong_migrations (Ruby on Rails).
