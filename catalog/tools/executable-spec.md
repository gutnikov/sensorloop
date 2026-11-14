---
title: The project's executable spec
summary: The project's requirement and spec files, in formats a program can read (an event model, decision tables, API contracts), with the checks that read them.
sensors: [requirement-trace, spec-completeness]
layer: project
---

An executable spec is a spec kept as text in the repository, in formats a program can check, so that a gap in it is
found by a command rather than by a reader. Executable means checkable, not run as code. Tests are derived from it, and
its checks keep it whole: one for each format, and one for the links between the requirements, the spec and the tests.

## Finding it

- **The requirement files**: the requirements split from each source (a ticket, a text), each with a stable id, its
  kind and its open questions. Often a `requirements/` or `specs/` folder, or items a requirements tool keeps in the
  repository.
- **The spine**: the one format every test is derived from, often an event model. Event Modeling describes a system as
  a timeline of slices: a screen, the command a person issues on it, the events the command records, and the read
  models those events build for later screens, with automations and the answers of outside systems between them.
- **The layers**: other formats, each kept for a risk the project names. Decision tables for prices, limits and
  permissions; state machines; API contracts for a public API; a formal model of a part with money or concurrency,
  checked by a model checker. Each feeds its cases into the spine as examples, so the test writer reads one place.
- **The checks**: in CI, a pre-commit hook or the task file, one for each format and one for the trace.

When the project has none, setting one up is a decision for a person. Each format is proposed with its cost and the
risk it covers, the cheapest form first: a table in the spine before a separate rules file, an example of a race
before a formal model.

## Using it for its sensors

- **Show each check catches a broken copy** before trusting it: make two or three broken copies of the spec (a field
  from nowhere, an error with no example, a link to a requirement that does not exist). The check must fire on each
  and pass the real spec. Most formats' official tools check syntax only: dmn-check, for decision tables in DMN (a
  standard format for them), finds overlapping rows but not missing ones. What they miss needs a check of the
  project's own.
- **For spec completeness**: run each format's check after every edit, in its strictest mode, which fails while any
  test obligation has no example. A rule nobody knows is marked unknown, never given a value.
- **For the requirement trace**: every spec element lists the ids of the requirements it covers, every test carries
  the id of the requirement or example it checks (as a tag, in its name or in a comment, as OpenFastTrace's tags do),
  and every functional requirement names its production signal.
- **A delta after each change**: the elements added, changed and removed since a git ref, which is the test writer's
  work list. Ids stay stable, since tests are tagged with them: a renamed example is a changed test.
- **The signals to the release**: the production signals of the requirements a change touches go where the
  loop that confirms the release in production reads them.

Examples: Event Modeling and DMN decision tables for the spec; Doorstop (requirements as YAML files), OpenFastTrace
(tags in code and tests) and Sphinx-Needs (linked objects in Sphinx documents) for the requirements and the trace.
