---
title: Keep the API compatible
summary: When the agent changes an API description, a library's public API or data that released clients read, a check compares the change with what callers already have, and the agent restores compatibility.
sensors: [api-compatibility]
when: Before each commit that changes an API description, a library's public API or data that released clients read; and again in CI as the final run.
failure: Any change that breaks an existing caller, or that the check cannot rule out as a break. An addition that callers can ignore passes.
next: The agent restores compatibility and checks again; it never edits the baseline or silences the check. It stops and asks a person when it cannot keep compatibility without undoing its task, or when a flagged change may not be a break, such as one the check could not decide on. Only a person decides that a break is wanted; the agent then adds a new version beside the old one and deprecates the old one, or, for data, raises the minimum client version.
---

## The loop

1. The agent changes an interface: an API description (OpenAPI, Protocol Buffers), a library's public API (its
   exported types and functions), or data that released clients fetch and use without updating, such as a catalog
   of models.
2. Before it commits, it runs the check against the baseline: the main branch for an API description or a library,
   the latest release for data that released clients read.
3. The check reports each break: the endpoint, message or symbol, and what changed in it. For a library, that is the
   diff of its API report; for data, the compiler errors of the release built with the new data.
4. The agent restores compatibility: it puts the field back, makes the new parameter optional, keeps the old type.
5. When it cannot without undoing its task, or when a flagged change may not be a break, it stops and asks a person.
   Only a person decides that a break is wanted. The agent then adds a new version of the API beside the old one and
   deprecates the old one; for data, it raises the minimum client version.
6. CI runs the same check on every pull request that changes an interface. That run is the one that counts: there
   the agent cannot change the baseline.

## Why

A breaking change in an API description can pass every test of the service itself: what breaks is the clients that
rely on the old one. Comparing it with what callers already have catches the break in the pull request, while
restoring compatibility or adding a new version is still cheap. The check sees only the form of the interface: a
field still present but filled differently passes, and when the API description drifts from the code, the check
compares the wrong things.

## Set up

- **One check per kind of interface.** For Protocol Buffers, `buf breaking --against '.git#branch=main'`. For
  OpenAPI, `oasdiff breaking <base> <revision> --fail-on WARN`. For a TypeScript library, which has no schema, API
  Extractor's report of every export per entry point, regenerated and compared with the committed one.
- **The baseline comes from main or the release**, never from a copy in the branch the agent can edit.
- **Fail on the doubtful too.** oasdiff marks definite breaks ERR and possible ones WARN, and fails only when told
  to. Use `--fail-on WARN`: a change the tool cannot decide on is one a person should look at. Keep buf at its
  default and strictest category, FILE, unless the project writes down why not.
- **Retiring goes through deprecation.** An endpoint marked deprecated with a sunset date may be removed at that
  date or later; an earlier removal is a break.
- **New API starts experimental**, under a path and an id that say so, and the check covers the stable API only. A
  test checks the boundary both ways: the check sees every stable operation and no experimental one. The test also
  fails when the check sees fewer operations than a floor, so a filter that drops them all cannot pass. When
  experimental API that has already shipped moves to its stable path and id, the old names stay as deprecated
  aliases until the next minor release.
- **A library's report has an owner.** A public API change shows in the pull request as a diff of the committed
  report, and code owners route it to a person. The agent can regenerate the report; only its owner approves it.
- **Data for released clients is checked against the release.** Before publishing, a job checks out the latest
  release's tag, merges the new data as the client does, and type-checks the release's code with it. Once a person
  has accepted the break, the way out of a failure is to raise the minimum client version in the same commit: older
  clients keep the last data published for them. A floor on the number of entries refuses the output of a
  half-failed generator.
- **Wiring.** The agent runs the check before each commit; it takes seconds. The CI job shows each break on the
  changed line, and the data check runs again before the data is published.
