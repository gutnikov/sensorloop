---
title: Structure check
type: computational
summary: Checks a file that has a required shape (a config, a schema, a CI workflow, a spec, a changelog, a release artifact) against that shape or a policy.
signal: The file, the field or path that is wrong, and what is wrong with it.
---

A structure check reads a file that must have a given shape, and checks it against that shape or against a policy.
Loops read it because configs, schemas, workflows and release files can break in ways the tests of the code never
see.

## What it sees

The structure of a file: a config against its schema, a CI workflow against a hardening policy, the links in the
documentation, a changelog whose released sections must not change, translation files with matching keys and
placeholders, and release artifacts with their checksums, signatures, architecture and list of files. It sees
structure, not meaning: a valid config can still be the wrong config.

## Reading the signal

- **Valid**: every checked file has the required shape and meets the policy.
- **Invalid**: the signal names the file, the field or path that is wrong, and what is wrong with it.
- **Nothing checked** is not a pass. A check that matched no files has observed nothing.

A check that cannot load its schema or policy fails for a reason that says nothing about the file. Read which kind of
failure it is before acting on it.
