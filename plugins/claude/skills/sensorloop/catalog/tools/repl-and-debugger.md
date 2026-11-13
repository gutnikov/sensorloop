---
title: The language's REPL and debugger
summary: "The interactive tools of the project's language: a REPL to call the code, a debugger to stop it and read its values."
sensors: [manual-probe]
layer: project
---

The project's language comes with a REPL to call the code and a debugger to stop it and read its values. Which ones
depend on the language and its setup, so they are found in the project rather than assumed.

## Finding it

- **The language and its environment**: the manifest (`pyproject.toml`, `package.json`, `go.mod`) and where the
  project's interpreter lives (a virtual environment, a version file).
- **A project console**, if there is one: `python manage.py shell`, `rails console`, `iex -S mix`.
- **The debugger**: built in (`pdb`, `node inspect`) or a development dependency (Delve).

## Using it

- **Drive them with scripts**, not interactive sessions: `python -c '...'`, `node -e '...'`, or a short file run
  once.
- **Give the debugger its commands up front**, from a file or the command line, so a run stops, prints and exits on
  its own.
- **Run inside the project's environment** (its virtual environment, its config), so values match what the tests
  see.
- **Remove debug output and breakpoints** before the work counts as done.

Examples: `python -c` and `pdb` (Python), `node -e` and `node inspect` (Node.js), Delve (Go), `jshell` (Java), any
debugger through the Debug Adapter Protocol.
