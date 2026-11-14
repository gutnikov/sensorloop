---
title: Structure check
type: computational
summary: Checks a file that has a required shape, such as a config, a CI workflow, a changelog or a release artifact, against that shape or a policy.
signal: The file, the field or path that is wrong, and what is wrong with it.
---

Loops read a structure check because configs, workflows and release artifacts can break in ways the tests of the code
never see.

## What it sees

The structure of a file, checked against its required shape or a policy. For example:

- a config, against its schema;
- a CI workflow, against a hardening policy;
- the documentation, for links that lead nowhere;
- a changelog, for released sections that changed;
- translation files, for keys and placeholders that do not match;
- a release artifact, for its checksums, signatures, architecture and list of files.

It sees structure, not meaning: a valid config can still be the wrong config.

## Reading the signal

- **Valid**: at least one file was checked, and every checked file has the required shape and meets the policy.
- **Invalid**: the signal names the file, the field or path that is wrong, and what is wrong with it.
- **Nothing checked**: the check matched no files. This is not a pass, even when the tool exits with success: a
  check that matched nothing has observed nothing.

A check that cannot load its schema or policy fails for a reason that says nothing about the file. Read which kind of
failure it is before acting on it.
