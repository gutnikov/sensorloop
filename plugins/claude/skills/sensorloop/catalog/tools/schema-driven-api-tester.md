---
title: Schema-driven API tester
summary: Generates requests from an API's schema, sends them to the running API, and checks every response against the schema.
sensors: [api-compatibility, input-fault-injection]
layer: project
---

A schema-driven API tester generates requests from an API's schema, sends them to the running API, and checks every
response against the schema. It tries the requests nobody wrote a test for.

## Finding it

It needs two things from the project: the API's schema (an OpenAPI or GraphQL document, in the repository or served by
the API) and a running copy of the API, started locally or on a preview. Look in CI for a job that already runs it
against one.

## Using it

- **Run it**: `schemathesis run` with the schema and the API's base address. Read its `--help`, since its flags have
  changed between versions.
- **Against test data only**: a local copy or a preview, never production, since it sends malformed and unexpected
  requests.
- **Authenticate**: give it a test account's token, so it reaches more than the login endpoint.
- **Keep each failure**: it reports the failing request as a command to replay, which becomes a regular test.

Examples: Schemathesis.
