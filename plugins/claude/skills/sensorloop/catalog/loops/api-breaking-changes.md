---
title: Keep the API compatible
summary: When the agent changes a schema, a library's public types or data that released clients read, a check compares the change with what callers already have, and the agent restores compatibility.
sensors: [api-compatibility]
when: Before each commit that changes an interface description, a library's exports or data that released clients read; and again in CI as the final run.
failure: Any change that breaks an existing caller, or that the check cannot rule out as a break. An addition that callers can ignore passes.
next: The agent restores compatibility and checks again; it never edits the baseline or silences the check. When the break is wanted, a person decides so, and the agent adds a new version beside the old one and deprecates the old one.
---

## The loop

1. The agent changes an interface: an API description (OpenAPI, Protocol Buffers), a library's public types, or
   data that released clients fetch and use without updating, such as a catalog of models.
2. Before it commits, it runs the check against the baseline: the main branch for a description or a library, the
   latest release for data that released clients read.
3. The check prints one line per break: the file, line and message; the endpoint, method and change; the diff of the
   library's API report; or the release it built, with each compiler error.
4. The agent restores compatibility: it puts the field back, makes the new parameter optional, keeps the old type.
5. Where the break is wanted, a person decides so. The agent then adds a new version of the API beside the old one,
   and deprecates the old one.
6. CI runs the same check on every pull request that changes an interface. That run is the one that counts: there
   the agent cannot change the baseline.

## Why

A breaking change in a schema can pass every test of the service itself: what breaks is the clients that rely on
the old schema. Comparing it with what callers already have catches the break in the pull request, while restoring
compatibility or adding a new version is still cheap. The check sees only the form of the interface: a field still
present but filled differently passes, and a schema that drifts from the code compares the wrong things.

## Set up

- **One check per kind of interface.** `buf breaking --against '.git#branch=main'` for Protocol Buffers;
  `oasdiff breaking <base> <revision> --fail-on WARN` for OpenAPI; for a TypeScript library, which has no schema,
  API Extractor's report of every export per entry point, regenerated and compared with the committed one.
- **The baseline comes from main or the release**, never from a copy in the branch the agent can edit.
- **Fail on the doubtful too.** oasdiff marks definite breaks ERR and possible ones WARN, and fails only when told
  to. Use `--fail-on WARN`: a change the tool cannot decide on is one a person should look at. Keep buf at its
  default and strictest category, FILE, unless the project writes down why not.
- **Retiring goes through deprecation.** An endpoint marked deprecated with a sunset date may be removed at that
  date or later; an earlier removal is a break.
- **New API starts experimental**, under a path and an id that say so, and the check covers the stable API only. A
  test guards the boundary both ways, and fails when it reads too few operations, so an empty list cannot pass. A
  breaking move of shipped API keeps the old names as deprecated aliases until the next minor release.
- **A library's report has an owner.** A public API change shows in the pull request as a diff of the committed
  report, and code owners route it to a person. The agent can regenerate the report; only its owner approves it.
- **Data for released clients is checked against the release.** Before publishing, a job checks out the latest
  release's tag, merges the new data as the client does, and type-checks the release's code with it. The way out of
  a failure is to raise the minimum client version in the same commit: older clients keep the last data published
  for them. A floor on the number of entries refuses the output of a half-failed generator.
- **Wiring.** The agent runs the check before each commit; it takes seconds. The CI job shows each break on the
  changed line, and the data check runs again before any upload.
