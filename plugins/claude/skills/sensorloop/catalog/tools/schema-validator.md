---
title: Schema validator
summary: Validates a YAML or JSON file against its JSON Schema, and names the field that breaks it.
sensors: [structure-check]
layer: project
---

A schema validator checks a YAML or JSON file against its JSON Schema, and names the field that breaks it. It catches
a malformed config before the program that reads it does.

## Finding it

Look for the schemas in the repository (`*.schema.json` files, a `schema/` directory) and for the step that validates
against them: a pre-commit hook, a task, a CI job. Many common formats have a published schema in the JSON Schema
Store.

## Using it

- **Run it**: `check-jsonschema --schemafile <schema> <files>`, or `ajv validate -s <schema> -d <file>` with ajv's
  command-line client.
- **Keep the schema next to what it describes**, so a change to one is reviewed with the other.
- **On commit and in CI**: a pre-commit hook gives the signal early, and CI makes sure it ran.
- **Pin a fetched schema**: a schema read from the web can change on its own; keep a copy or pin its version.

Examples: check-jsonschema, ajv (JavaScript).
